import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px'
}

const defaultCenter = { lat: 13.0456, lng: 80.1021 }

export default function BusMap({ busLocations = [] }) {
  return (
    <LoadScript googleMapsApiKey="AIzaSyD2jKjetYt0Y9rg1zPuY94MVd07OHZnGlk">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={busLocations.length > 0 ? { lat: busLocations[0].lat, lng: busLocations[0].lng } : defaultCenter}
        zoom={13}
      >
        {busLocations.map((loc, i) => (
          <Marker
            key={i}
            position={{ lat: loc.lat, lng: loc.lng }}
            title={loc.busNumber}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  )
}