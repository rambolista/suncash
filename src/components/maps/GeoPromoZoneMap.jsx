import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Button, Form } from 'react-bootstrap'
import { MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import Icon from '@/components/wrappers/Icon'

const bahamasCenter = [25.0343, -77.3963]

const configuredMarkerIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})

const toLatLngArray = (points) => points.map((point) => [point.lat, point.lng])

const MapRecenter = ({ focusPosition, focusZoom = 14 }) => {
  const map = useMap()

  if (focusPosition) {
    map.setView(focusPosition, focusZoom)
  }

  return null
}

/**
 * `MapContainer`'s `center`/`zoom` props are only read once, at mount —
 * they don't reactively follow later prop changes. Since the modal loads
 * an existing zone's points asynchronously (after the map has already
 * mounted with an empty polygon), the view needs an explicit one-time
 * fit-to-bounds once real points show up, or it's stuck on the default
 * center/zoom forever.
 */
const ZoneRecenter = ({ points }) => {
  const map = useMap()
  const hasFit = useRef(false)

  useEffect(() => {
    if (hasFit.current || points.length === 0) return
    hasFit.current = true

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15)
    } else {
      map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [40, 40] })
    }
  }, [points, map])

  return null
}

const ZoneClickHandler = ({ onAddPoint, readOnly }) => {
  useMapEvents({
    click(event) {
      if (readOnly) return
      onAddPoint({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })

  return null
}

/**
 * Sign Up Promotion zone editor — click the map to add polygon vertices
 * (mirrors legacy admin's Google Maps click-to-draw flow, rebuilt with
 * Leaflet + free OpenStreetMap tiles/search so no API key is required).
 */
const GeoPromoZoneMap = ({ coordinates = [], onChange, readOnly = false, height = 420 }) => {
  const [searchAddress, setSearchAddress] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [focusPosition, setFocusPosition] = useState(null)

  const points = Array.isArray(coordinates) ? coordinates : []
  const center = points.length ? [points[0].lat, points[0].lng] : bahamasCenter

  const handleAddPoint = (point) => {
    onChange?.([...points, point])
  }

  const handleUndo = () => {
    onChange?.(points.slice(0, -1))
  }

  const handleClear = () => {
    onChange?.([])
  }

  const handleSearchAddress = async (event) => {
    if (event) event.preventDefault()
    if (!searchAddress.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    setSearchError('')
    try {
      const query = new URLSearchParams({
        q: searchAddress.trim(),
        format: 'jsonv2',
        limit: '5',
        addressdetails: '1',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Unable to search location right now.')
      const results = await response.json()
      setSearchResults(Array.isArray(results) ? results : [])
      if (!results?.length) setSearchError('No matching address found. Try a more specific search.')
    } catch (error) {
      setSearchError(error?.message || 'Unable to search location right now.')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelectSearchResult = (result) => {
    const lat = Number(result?.lat)
    const lng = Number(result?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    setFocusPosition([lat, lng])
  }

  return (
    <div className="border rounded overflow-hidden">
      {!readOnly && (
        <div className="p-2 border-bottom bg-body-tertiary">
          <div className="d-flex gap-2">
            <Form.Control
              type="text"
              value={searchAddress}
              onChange={(event) => setSearchAddress(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSearchAddress()
                }
              }}
              placeholder="Search a place to jump the map there (e.g. Nassau, Bahamas)"
            />
            <Button type="button" variant="primary" disabled={searching} onClick={() => handleSearchAddress()}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
            <Button type="button" variant="outline-secondary" onClick={handleUndo} disabled={!points.length} title="Remove last point">
              <Icon icon="arrow-back-up" />
            </Button>
            <Button type="button" variant="outline-danger" onClick={handleClear} disabled={!points.length} title="Clear all points">
              <Icon icon="trash" />
            </Button>
          </div>
          {searchError && <div className="text-danger small mt-2">{searchError}</div>}
          {searchResults.length > 0 && (
            <div className="mt-2 d-flex flex-wrap gap-1">
              {searchResults.map((result) => (
                <Button
                  key={`${result.place_id}-${result.lat}-${result.lon}`}
                  type="button"
                  variant="light"
                  size="sm"
                  className="text-start"
                  onClick={() => handleSelectSearchResult(result)}
                  title={result.display_name}
                >
                  {result.display_name}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
      <MapContainer center={center} zoom={points.length ? 13 : 7} scrollWheelZoom style={{ height, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoneRecenter points={points} />
        <MapRecenter focusPosition={focusPosition} />
        <ZoneClickHandler onAddPoint={handleAddPoint} readOnly={readOnly} />
        {points.map((point, index) => (
          <Marker key={index} position={[point.lat, point.lng]} icon={configuredMarkerIcon} />
        ))}
        {points.length >= 3 && (
          <Polygon positions={toLatLngArray(points)} pathOptions={{ color: '#0d6efd', fillOpacity: 0.2 }} />
        )}
      </MapContainer>
      {!readOnly && (
        <div className="small text-muted p-2 border-top">
          Click on the map to add points (at least 3) drawing the zone where new signups earn the bonus. Use the undo/clear buttons to adjust.
        </div>
      )}
    </div>
  )
}

export default GeoPromoZoneMap
