import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px'
}

const defaultCenter = { lat: 13.0456, lng: 80.1021 }

export default function BusMap({ busLocations = [] }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyD2jKjetYt0Y9rg1zPuY94MVd07OHZnGlk'
  })

  if (!isLoaded) return (
    <div className="h-40 flex items-center justify-center text-gray-400 text-sm bg-[#EFF6FF] rounded-xl">
      Loading map...
    </div>
  )

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={busLocations.length > 0 ? { lat: busLocations[0].lat, lng: busLocations[0].lng } : defaultCenter}
      zoom={13}
    >
      {busLocations.map((loc, i) => (
        <Marker
          key={i}
          position={{ lat: loc.lat, lng: loc.lng }}
          icon={{
            url: 'https://img.icons8.com/color/48/bus.png',
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20),
            labelOrigin: new window.google.maps.Point(20, 48)
          }}
          label={{
            text: loc.busNumber || 'Bus',
            color: '#1E3A5F',
            fontWeight: 'bold',
            fontSize: '11px'
          }}
          title={loc.busNumber}
        />
      ))}
    </GoogleMap>
  )
}