-- PBI-025: Detekcija duplikata prijave kvara
-- Indeks za ubrzanje upita koji pretražuje prijave kvara po korisniku, kompaniji i datumu
-- koristi se u findRecentFaultReports() metodi za provjeru duplikata

CREATE INDEX IF NOT EXISTS `FaultReport_userId_companyId_reportedAt_idx`
  ON `FaultReport` (`userId`, `companyId`, `reportedAt`);
