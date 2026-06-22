import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { getBuildings, getFloors, getRooms } from "../services/api";
import { Link } from "react-router-dom";
import { Building2, MapPin, Menu, X } from "lucide-react";

// Map view updater
function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

const CampusMap = () => {
  const collegeBuilding = {
    _id: "college_1",
    name: "Sigma College",
    description: "Main Campus",
    latitude: 22.324651052939384,
    longitude: 73.28028071911696,
  };

  const [buildings, setBuildings] = useState([collegeBuilding]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([
    collegeBuilding.latitude,
    collegeBuilding.longitude,
  ]);
  const [mapZoom, setMapZoom] = useState(15);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mapRef = useRef();

  // Fetch buildings + live location
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await getBuildings();
        setBuildings((prev) => [
          ...prev,
          ...res.data.filter((b) => b._id !== collegeBuilding._id),
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBuildings();

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) =>
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Fetch floors
  useEffect(() => {
    const fetchFloors = async () => {
      if (!selectedBuilding) return;
      try {
        const res = await getFloors(selectedBuilding);
        setFloors(res.data);
        if (res.data.length > 0) setSelectedFloor(res.data[0]._id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFloors();
  }, [selectedBuilding]);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      if (!selectedBuilding || !selectedFloor) return;
      try {
        const res = await getRooms({
          building_id: selectedBuilding,
          floor_id: selectedFloor,
        });
        setRooms(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRooms();
  }, [selectedBuilding, selectedFloor]);

  // Building click
  const handleBuildingClick = (b) => {
    setSelectedBuilding(b._id);
    setMapCenter([b.latitude, b.longitude]);
    setMapZoom(18);
    setSidebarOpen(false);

    if (mapRef.current) {
      mapRef.current.flyTo([b.latitude, b.longitude], 18, {
        animate: true,
        duration: 2,
      });
    }
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md p-4 z-50 flex justify-between items-center">
        <h2 className="text-xl font-bold">Campus Map</h2>
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="h-7 w-7" />
        </button>
      </div>

      <div className="flex h-screen pt-14 lg:pt-0">

        {/* Sidebar / Drawer */}
        <div
          className={`fixed lg:static inset-y-0 left-0 w-72 bg-white shadow-lg p-4 overflow-y-auto 
          transform transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >

          {/* Mobile close button */}
          <div className="lg:hidden flex justify-end mb-3">
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-4 hidden lg:block">Campus Map</h2>

          {/* Buildings */}
          <h3 className="font-semibold mb-2">Buildings</h3>
          <div className="space-y-2 mb-6">
            {buildings.map((b) => (
              <button
                key={b._id}
                onClick={() => handleBuildingClick(b)}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedBuilding === b._id
                    ? "bg-blue-100 border-blue-500"
                    : "border-gray-300"
                }`}
              >
                <div className="flex space-x-2">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-sm text-gray-600">{b.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Floors */}
          {floors.length > 0 && (
            <>
              <h3 className="font-semibold mb-2">Floors</h3>
              <div className="space-y-2 mb-6">
                {floors.map((f) => (
                  <button
                    key={f._id}
                    onClick={() => setSelectedFloor(f._id)}
                    className={`w-full p-3 rounded-lg border ${
                      selectedFloor === f._id
                        ? "bg-blue-100 border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {f.floor_name || `Floor ${f.floor_number}`}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Rooms */}
          {rooms.length > 0 && (
            <>
              <h3 className="font-semibold mb-2">Rooms</h3>
              <div className="space-y-2">
                {rooms.map((room) => (
                  <Link
                    key={room._id}
                    to={`/room/${room._id}`}
                    className="block p-3 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    <p className="font-medium">{room.room_no}</p>
                    <p className="text-sm text-gray-600">{room.type}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Map Section */}
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            <MapViewUpdater center={mapCenter} zoom={mapZoom} />

            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {buildings.map((b) => (
              <Marker key={b._id} position={[b.latitude, b.longitude]}>
                <Popup>
                  <h3 className="font-semibold">{b.name}</h3>
                  <p>{b.description}</p>
                </Popup>
              </Marker>
            ))}

            {currentLocation && (
              <Marker position={currentLocation}>
                <Popup>
                  <div className="flex items-center gap-2">
                    <MapPin /> <span>You are here</span>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* My Location Button (Mobile Only) */}
          {currentLocation && (
            <button
              onClick={() =>
                mapRef.current?.flyTo(currentLocation, 18, { animate: true })
              }
              className="lg:hidden absolute bottom-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg"
            >
              My Location
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CampusMap;
