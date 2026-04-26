import { prisma } from "../config/database";
import type { RegisterInput } from "../modules/auth/auth.schema";

export type RegisteredUser = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: Date;
};

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class KeycloakError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeycloakError";
  }
}

async function getKeycloakAdminToken(): Promise<string> {
  const res = await fetch(
    `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
      }),
    }
  );
  if (!res.ok) throw new KeycloakError("Ne mogu dobiti Keycloak admin token.");
  const data = await res.json();
  return data.access_token;
}

async function createKeycloakUser(
  token: string,
  input: RegisterInput
): Promise<string> {
  const res = await fetch(
    `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: input.username,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        enabled: true,
        credentials: [
          { type: "password", value: input.password, temporary: false },
        ],
      }),
    }
  );

  if (res.status === 409) {
    throw new ConflictError("Korisnik s tim emailom ili korisničkim imenom već postoji u sistemu.");
  }
  if (!res.ok) {
    const errorDetails = await res.text(); 
    console.error("[Keycloak Debug] Detalji greške:", errorDetails); 
    throw new KeycloakError("Greška pri kreiranju korisnika u Keycloaku.");
  }

  const location = res.headers.get("Location");
  if (!location) throw new KeycloakError("Keycloak nije vratio ID novog korisnika.");
  
  const sub = location.split("/").pop();
  if (!sub) throw new KeycloakError("Ne mogu parsirati Keycloak korisničkog ID-a.");
  return sub;
}

export class AuthService {
 async register(input: RegisterInput): Promise<RegisteredUser> {
    const { firstName, lastName, username, email, password, companyId } = input;

    console.log(`[AuthService] Pokušaj registracije za korisnika: ${username} (${email})`);

    if (companyId) {
      console.log(`[AuthService] Provjera firme ID: ${companyId}`);
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        console.warn(`[AuthService] Firma sa ID ${companyId} nije pronađena.`);
        throw new ConflictError("The selected company does not exist.");
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existingUser) {
      console.warn(`[AuthService] Korisnik već postoji u lokalnoj bazi (username/email).`);
      throw new ConflictError("Username or email is already taken.");
    }

    let keycloakSub: string;
    try {
      console.log(`[AuthService] Dobavljanje Keycloak admin tokena...`);
      const adminToken = await getKeycloakAdminToken();
      
      console.log(`[AuthService] Kreiranje korisnika u Keycloaku...`);
      keycloakSub = await createKeycloakUser(adminToken, input);
      console.log(`[AuthService] Keycloak korisnik kreiran uspješno (SUB: ${keycloakSub})`);
    } catch (err) {
      console.error(`[AuthService] Greška u komunikaciji s Keycloakom:`, err);
      throw err;
    }

    try {
      console.log(`[AuthService] Spasavanje korisnika u MySQL...`);
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          username,
          email,
          companyId: companyId ?? null,
          externalIdentities: {
            create: {
              provider: "keycloak",
              providerSubject: keycloakSub,
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          createdAt: true,
        },
      });
      console.log(`[AuthService] Korisnik uspješno spašen u bazu (ID: ${user.id})`);
      return user;
    } catch (err) {
      console.error(`[AuthService] Kritična greška: Keycloak korisnik kreiran, ali MySQL upis nije uspio:`, err);
      throw new Error("Greška pri upisu u lokalnu bazu podataka.");
    }
  }
}