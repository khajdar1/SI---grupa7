'use client';
export const runtime = 'edge';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';

import { EmptyState, PageHeader, PageLayout, PriorityBadge, InterventionStatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { getMapInterventions, type MapIntervention } from '@/services/maps.service';

const ALL = 'ALL';
const UNASSIGNED = 'UNASSIGNED';
const DEFAULT_CENTER = { latitude: 43.8563, longitude: 18.4131 };
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;
const TILE_SIZE = 256;

type Point = { x: number; y: number };
type MapCenter = { latitude: number; longitude: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function project(latitude: number, longitude: number, zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom;
  const clampedLatitude = clamp(latitude, -85.0511, 85.0511);
  const latRad = (clampedLatitude * Math.PI) / 180;

  return {
    x: ((longitude + 180) / 360) * scale,
    y:
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      scale,
  };
}

function unproject(point: Point, zoom: number): MapCenter {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = (point.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * point.y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return {
    latitude: clamp(latitude, -85.0511, 85.0511),
    longitude: ((longitude + 540) % 360) - 180,
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getInitialCenter(items: MapIntervention[]): MapCenter {
  if (items.length === 0) {
    return DEFAULT_CENTER;
  }

  return {
    latitude: items.reduce((sum, item) => sum + item.latitude, 0) / items.length,
    longitude: items.reduce((sum, item) => sum + item.longitude, 0) / items.length,
  };
}

function InterventionMap({
  items,
  selected,
  onSelect,
}: {
  items: MapIntervention[];
  selected: MapIntervention | null;
  onSelect: (item: MapIntervention | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; start: Point; center: Point } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(13);
  const [center, setCenter] = useState<MapCenter>(() => getInitialCenter(items));

  useEffect(() => {
    setCenter(getInitialCenter(items));
  }, [items]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const centerPoint = useMemo(() => project(center.latitude, center.longitude, zoom), [center, zoom]);
  const maxTile = 2 ** zoom;
  const tileRange = useMemo(() => {
    if (!size.width || !size.height) {
      return [];
    }

    const minX = Math.floor((centerPoint.x - size.width / 2) / TILE_SIZE);
    const maxX = Math.floor((centerPoint.x + size.width / 2) / TILE_SIZE);
    const minY = Math.floor((centerPoint.y - size.height / 2) / TILE_SIZE);
    const maxY = Math.floor((centerPoint.y + size.height / 2) / TILE_SIZE);
    const tiles: Array<{ x: number; y: number; wrappedX: number; left: number; top: number }> = [];

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        if (y < 0 || y >= maxTile) {
          continue;
        }

        tiles.push({
          x,
          y,
          wrappedX: ((x % maxTile) + maxTile) % maxTile,
          left: x * TILE_SIZE - centerPoint.x + size.width / 2,
          top: y * TILE_SIZE - centerPoint.y + size.height / 2,
        });
      }
    }

    return tiles;
  }, [centerPoint, maxTile, size.height, size.width]);

  const markers = useMemo(
    () =>
      items.map((item) => {
        const point = project(item.latitude, item.longitude, zoom);
        return {
          item,
          left: point.x - centerPoint.x + size.width / 2,
          top: point.y - centerPoint.y + size.height / 2,
        };
      }),
    [centerPoint, items, size.height, size.width, zoom],
  );

  const selectedMarker = selected
    ? markers.find((marker) => marker.item.id === selected.id) ?? null
    : null;

  const resetView = () => {
    setCenter(getInitialCenter(items));
    setZoom(items.length > 1 ? 12 : 14);
  };

  const updateZoom = (nextZoom: number) => {
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-background p-2">
        <div className="text-sm text-muted-foreground">
          {items.length} mapped intervention{items.length === 1 ? '' : 's'}
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => updateZoom(zoom + 1)} aria-label="Zoom in">
            <Plus className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => updateZoom(zoom - 1)} aria-label="Zoom out">
            <Minus className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetView} aria-label="Reset map">
            <LocateFixed className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[68vh] min-h-[420px] touch-none select-none overflow-hidden bg-slate-200"
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          dragRef.current = {
            pointerId: event.pointerId,
            start: { x: event.clientX, y: event.clientY },
            center: centerPoint,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) {
            return;
          }

          const dx = event.clientX - drag.start.x;
          const dy = event.clientY - drag.start.y;
          setCenter(unproject({ x: drag.center.x - dx, y: drag.center.y - dy }, zoom));
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
          }
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        onWheel={(event) => {
          event.preventDefault();
          updateZoom(zoom + (event.deltaY < 0 ? 1 : -1));
        }}
      >
        {tileRange.map((tile) => (
          <img
            key={`${tile.x}-${tile.y}`}
            src={`https://tile.openstreetmap.org/${zoom}/${tile.wrappedX}/${tile.y}.png`}
            alt=""
            draggable={false}
            className="absolute h-64 w-64 max-w-none"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}

        {markers.map(({ item, left, top }) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Open ${item.name}`}
            className={cn(
              'absolute z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ring-2 ring-black/10 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/35',
              selected?.id === item.id && 'scale-125 ring-4 ring-primary/35',
            )}
            style={{ left, top, backgroundColor: item.priorityColor }}
            onClick={() => onSelect(item)}
          />
        ))}

        {selected && selectedMarker ? (
          <div
            className="absolute z-20 w-80 max-w-[calc(100%-2rem)] rounded-lg border bg-background p-4 shadow-xl"
            style={{
              left: clamp(selectedMarker.left + 14, 16, Math.max(16, size.width - 336)),
              top: clamp(selectedMarker.top - 14, 16, Math.max(16, size.height - 260)),
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={ROUTES.INTERVENTION(selected.id)} className="font-semibold text-foreground hover:underline">
                  {selected.name}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{selected.location}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>
                Close
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <PriorityBadge priority={selected.priority} />
                <InterventionStatusBadge status={selected.status} />
              </div>
              <p>
                <span className="text-muted-foreground">Company:</span> {selected.companyName}
              </p>
              <p>
                <span className="text-muted-foreground">Category:</span> {selected.categoryName}
              </p>
              <p>
                <span className="text-muted-foreground">Servicer:</span>{' '}
                {selected.assignments.length > 0
                  ? selected.assignments.map((assignment) => assignment.label).join(', ')
                  : 'Unassigned'}
              </p>
              <p>
                <span className="text-muted-foreground">Due:</span> {formatDate(selected.dueAt)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
          OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [items, setItems] = useState<MapIntervention[]>([]);
  const [status, setStatus] = useState(ALL);
  const [servicerId, setServicerId] = useState(ALL);
  const [selected, setSelected] = useState<MapIntervention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getMapInterventions({
        status: status === ALL ? undefined : status,
        servicerId: servicerId === ALL ? undefined : servicerId,
      });
      setItems(response.items);
      setSelected((current) =>
        current && response.items.some((item) => item.id === current.id) ? current : null,
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load map data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, servicerId]);

  const servicerOptions = useMemo(() => {
    const options = new Map<string, string>();
    items.forEach((item) => {
      item.assignments.forEach((assignment) => options.set(String(assignment.userId), assignment.label));
    });

    return Array.from(options.entries())
      .sort((a, b) => a[1].localeCompare(b[1], 'en'))
      .map(([value, label]) => ({ value, label }));
  }, [items]);

  const isFiltered = status !== ALL || servicerId !== ALL;

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        title="Intervention Map"
        subtitle="Spatial view of geocoded, non-archived interventions."
        breadcrumbs={[{ label: 'Dashboard', href: ROUTES.DASHBOARD }, { label: 'Map' }]}
        secondaryActions={[
          {
            label: 'List',
            href: ROUTES.INTERVENTIONS,
            variant: 'outline',
          },
        ]}
      />

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 lg:flex-row lg:items-center">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-row">
          <Select value={status} onValueChange={(value) => setStatus(value ?? ALL)}>
            <SelectTrigger className="w-full sm:min-w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="NEW">Open</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="IN_PROGRESS">In progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={servicerId} onValueChange={(value) => setServicerId(value ?? ALL)}>
            <SelectTrigger className="w-full sm:min-w-56">
              <SelectValue placeholder="Servicer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All servicers</SelectItem>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {servicerOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStatus(ALL);
                setServicerId(ALL);
              }}
            >
              <RotateCcw className="mr-2 size-4" />
              Clear
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void loadData()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[68vh] min-h-[420px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading map data...
        </div>
      ) : error ? (
        <EmptyState title="Map data unavailable" description={error} action={{ label: 'Retry', onClick: () => void loadData() }} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No mapped interventions"
          description="No interventions with validated coordinates match the selected filters."
          action={{ label: 'Open interventions', onClick: () => { window.location.href = ROUTES.INTERVENTIONS; } }}
        />
      ) : (
        <InterventionMap items={items} selected={selected} onSelect={setSelected} />
      )}
    </PageLayout>
  );
}
