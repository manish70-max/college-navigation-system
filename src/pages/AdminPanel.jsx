import { useState, useEffect } from "react";
import {
  Building2,
  Layers,
  DoorOpen,
  Users,
  GraduationCap,
  MapPin,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import {
  getAdminDashboard,
  getBuildings,
  getFloors,
  getRooms,
  getFaculty,
  getDepartments,
  getFacilities,
} from "../services/api";
import api from "../services/api";

const AdminPanel = () => {
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [formData, setFormData] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab !== "dashboard") {
      fetchData();
    }
  }, [activeTab]);

  // Reset form when switching tabs
  useEffect(() => {
    setFormData({});
    setEditing(null);
  }, [activeTab]);

  // Refresh departments when faculty tab is active
  useEffect(() => {
    if (activeTab === "faculty") {
      const refreshDepartments = async () => {
        try {
          const deptsRes = await getDepartments();
          console.log("Departments loaded:", deptsRes.data);
          setDepartments(deptsRes.data || []);
        } catch (error) {
          console.error("Error refreshing departments:", error);
          setDepartments([]);
        }
      };
      refreshDepartments();
    }
  }, [activeTab]);

  const fetchDashboard = async () => {
    try {
      const response = await getAdminDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        buildingsRes,
        floorsRes,
        roomsRes,
        facultyRes,
        deptsRes,
        facilitiesRes,
      ] = await Promise.all([
        getBuildings(),
        getFloors(),
        getRooms(),
        getFaculty(),
        getDepartments(),
        getFacilities(),
      ]);
      setBuildings(buildingsRes.data || []);
      setFloors(floorsRes.data || []);
      setRooms(roomsRes.data || []);
      setFaculty(facultyRes.data || []);
      setDepartments(deptsRes.data || []);
      setFacilities(facilitiesRes.data || []);

      // Debug log
      console.log("Data loaded - Departments:", deptsRes.data?.length || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error loading data. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e, endpoint) => {
    e.preventDefault();
    try {
      // Clean up formData - remove empty strings, convert to proper format
      const cleanData = { ...formData };

      // Remove empty string values and convert to null for optional fields
      Object.keys(cleanData).forEach((key) => {
        if (cleanData[key] === "" || cleanData[key] === null) {
          if (key === "room_id" || key === "floor_id") {
            // Don't send empty optional IDs
            delete cleanData[key];
          } else if (
            key === "phone" ||
            key === "office_hours" ||
            key === "description" ||
            key === "overview"
          ) {
            // Optional string fields - can be empty
            delete cleanData[key];
          } else {
            delete cleanData[key];
          }
        }
      });

      // Ensure required fields are present for faculty
      if (endpoint === "/api/faculty") {
        if (!cleanData.name || !cleanData.department || !cleanData.email) {
          alert("Please fill all required fields: Name, Department, and Email");
          return;
        }
        // Ensure designation has a default value
        if (!cleanData.designation) {
          cleanData.designation = "Lecturer";
        }
      }

      console.log("Submitting data:", cleanData); // Debug log

      if (editing) {
        await api.put(`${endpoint}/${editing}`, cleanData);
      } else {
        await api.post(endpoint, cleanData);
      }
      setFormData({});
      setEditing(null);
      await fetchData();
      await fetchDashboard();
      alert(editing ? "Updated successfully!" : "Created successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      console.error("Error details:", error.response?.data); // Debug log
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unknown error";
      alert("Error saving data: " + errorMsg);
    }
  };

  const handleDelete = async (endpoint, id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      fetchData();
      fetchDashboard();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting data");
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Building2 },
    { id: "buildings", label: "Buildings", icon: Building2 },
    { id: "floors", label: "Floors", icon: Layers },
    { id: "rooms", label: "Rooms", icon: DoorOpen },
    { id: "faculty", label: "Faculty", icon: Users },
    { id: "departments", label: "Departments", icon: GraduationCap },
    { id: "facilities", label: "Facilities", icon: MapPin },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex overflow-x-auto  space-x-2 mb-6 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dashboard */}
      {activeTab === "dashboard" && dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-600">Buildings</p>
            <p className="text-2xl font-bold">{dashboard.buildings}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-600">Floors</p>
            <p className="text-2xl font-bold">{dashboard.floors}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-600">Rooms</p>
            <p className="text-2xl font-bold">{dashboard.rooms}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-600">Faculty</p>
            <p className="text-2xl font-bold">{dashboard.faculty}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-600">Departments</p>
            <p className="text-2xl font-bold">{dashboard.departments}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-600">Facilities</p>
            <p className="text-2xl font-bold">{dashboard.facilities}</p>
          </div>
        </div>
      )}

      {/* Buildings Management */}
      {activeTab === "buildings" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Add/Edit Building</h2>
            <form
              onSubmit={(e) => handleSubmit(e, "/buildings")}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={formData.latitude || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: parseFloat(e.target.value),
                    })
                  }
                  className="border rounded-lg px-4 py-2"
                  required
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={formData.longitude || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: parseFloat(e.target.value),
                    })
                  }
                  className="border rounded-lg px-4 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                {editing ? "Update" : "Create"} Building
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Buildings List</h2>
            <div className="space-y-2">
              {buildings.map((building) => (
                <div
                  key={building._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{building.name}</p>
                    <p className="text-sm text-gray-600">
                      {building.description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditing(building._id);
                        setFormData(building);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete("/buildings", building._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floors Management */}
      {activeTab === "floors" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Add/Edit Floor</h2>
            <form
              onSubmit={(e) => handleSubmit(e, "/floors")}
              className="space-y-4"
            >
              <select
                value={formData.building_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, building_id: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="">Select Building</option>
                {buildings.map((building) => (
                  <option key={building._id} value={building._id}>
                    {building.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Floor Number (0 for Ground, 1 for First, etc.)"
                  value={formData.floor_number || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      floor_number: parseInt(e.target.value),
                    })
                  }
                  className="border rounded-lg px-4 py-2"
                  required
                  min="0"
                />
                <input
                  type="text"
                  placeholder="Floor Name (e.g., Ground Floor, First Floor)"
                  value={formData.floor_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, floor_name: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2"
                />
              </div>
              <textarea
                placeholder="Description (optional)"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
              />
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                {editing ? "Update" : "Create"} Floor
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Floors List</h2>
            <div className="space-y-2">
              {floors.map((floor) => (
                <div
                  key={floor._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {floor.floor_name || `Floor ${floor.floor_number}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Building: {floor.building_id?.name}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditing(floor._id);
                        setFormData({
                          ...floor,
                          building_id:
                            floor.building_id?._id || floor.building_id,
                        });
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete("/floors", floor._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rooms Management */}
      {activeTab === "rooms" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Add/Edit Room</h2>
            <form
              onSubmit={(e) => handleSubmit(e, "/rooms")}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.building_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, building_id: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select Building</option>
                  {buildings.map((building) => (
                    <option key={building._id} value={building._id}>
                      {building.name}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.floor_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, floor_id: e.target.value })
                  }
                  className="border rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Select Floor</option>
                  {floors
                    .filter(
                      (floor) => floor.building_id?._id === formData.building_id
                    )
                    .map((floor) => (
                      <option key={floor._id} value={floor._id}>
                        {floor.floor_name || `Floor ${floor.floor_number}`}
                      </option>
                    ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Room Number (e.g., 101, 201)"
                value={formData.room_no || ""}
                onChange={(e) =>
                  setFormData({ ...formData, room_no: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
                required
              />
              {/* <select
                value={formData.type || ""}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="">Select Room Type</option>
                <option value="Classroom">Classroom</option>
                <option value="Lab">Lab</option>
                <option value="Office">Office</option>
                <option value="Faculty Cabin">Faculty Cabin</option>
                <option value="Hall">Hall</option>
                <option value="Washroom">Washroom</option>
                <option value="Emergency Exit">Emergency Exit</option>
                <option value="Other">Other</option>
              </select> */}
  

                 <select
  value={formData.type || ""}
  onChange={(e) =>
    setFormData({ ...formData, type: e.target.value.toLowerCase() })
  }
  className="w-full border rounded-lg px-4 py-2"
  required
>
  <option value="">Select Room Type</option>
  {["Classroom","Lab","Office","Faculty Cabin","Hall","Washroom","Emergency Exit","Other"].map((type) => (
    <option key={type} value={type.toLowerCase()}>
      {type}
    </option>
  ))}
</select>








              <input
                type="number"
                placeholder="Capacity (number of seats)"
                value={formData.capacity || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full border rounded-lg px-4 py-2"
                min="0"
              />
              <textarea
                placeholder="Description (optional)"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
              />
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                {editing ? "Update" : "Create"} Room
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Rooms List</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div key={room._id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">Room {room.room_no}</p>
                      <p className="text-sm text-gray-600">{room.type}</p>
                      <p className="text-sm text-gray-600">
                        {room.building_id?.name}
                      </p>
                      {room.capacity > 0 && (
                        <p className="text-sm text-gray-500">
                          Capacity: {room.capacity}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditing(room._id);
                          setFormData({
                            ...room,
                            building_id:
                              room.building_id?._id || room.building_id,
                            floor_id: room.floor_id?._id || room.floor_id,
                          });
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete("/rooms", room._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Faculty Management */}
      {activeTab === "faculty" && (
        <div className="space-y-6">
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">Loading data...</p>
            </div>
          )}
          {departments.length === 0 && !loading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 mb-2">
                ⚠️ No departments found. Please add a department first before
                adding faculty.
              </p>
              <button
                onClick={() => {
                  setActiveTab("departments");
                }}
                className="text-blue-600 hover:underline text-sm"
              >
                Go to Departments tab to add one →
              </button>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Add/Edit Faculty</h2>
              <button
                onClick={fetchData}
                className="text-sm text-primary-600 hover:text-primary-800 flex items-center space-x-1"
                title="Refresh data"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Fields marked with <span className="text-red-500">*</span> are
              required
            </p>
            <form
              onSubmit={(e) => handleSubmit(e, "/faculty")}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dr. John Smith"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={
                      formData.department?._id || formData.department || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log("Department selected:", value);
                      setFormData({ ...formData, department: value });
                    }}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    required
                    disabled={departments.length === 0}
                    style={{ minHeight: "42px" }}
                  >
                    <option value="">
                      {departments.length === 0
                        ? "No departments available. Add department first."
                        : "-- Select Department --"}
                    </option>
                    {departments.map((dept) => {
                      console.log(
                        "Rendering department option:",
                        dept._id,
                        dept.name
                      );
                      return (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      );
                    })}
                  </select>
                  {departments.length > 0 ? (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {departments.length} department
                      {departments.length !== 1 ? "s" : ""} loaded
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ No departments found. Go to Departments tab to add one.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.designation || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Designation</option>
                    <option value="HOD">HOD</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">
                      Associate Professor
                    </option>
                    <option value="Assistant Professor">
                      Assistant Professor
                    </option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room (Optional)
                </label>
                <select
                  value={formData.room_id || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      room_id: value === "" ? undefined : value,
                    });
                  }}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Room (Optional)</option>
                  {rooms.filter(
                    (room) =>
                      room.type === "Faculty Cabin" || room.type === "Office"
                  ).length > 0 ? (
                    rooms
                      .filter(
                        (room) =>
                          room.type === "Faculty Cabin" ||
                          room.type === "Office"
                      )
                      .map((room) => (
                        <option key={room._id} value={room._id}>
                          {room.room_no} -{" "}
                          {room.building_id?.name || "Unknown Building"} -{" "}
                          {room.type}
                        </option>
                      ))
                  ) : (
                    <option disabled>
                      No Faculty Cabin or Office rooms available. Please add
                      rooms first.
                    </option>
                  )}
                </select>
              </div> */}


             <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Room (Optional)
  </label>
  <select
    value={formData.room_id || ""} // Use the ID directly
    onChange={(e) => {
      const value = e.target.value;
      setFormData({
        ...formData,
        room_id: value === "" ? undefined : value, // undefined if nothing selected
      });
    }}
    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
  >
    <option value="">Select Room (Optional)</option>

    {rooms.length > 0 ? (
      rooms
        .filter((room) => room.type === "Faculty Cabin" || room.type === "Office")
        .map((room) => (
          <option key={room._id} value={room._id}>
            {room.room_no} - {room.building_id?.name || "Unknown Building"} - {room.type}
          </option>
        ))
    ) : (
      <option disabled>
        No Faculty Cabin or Office rooms available. Please add rooms first.
      </option>
    )}
  </select>
</div>













              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g., john.smith@university.edu"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., +91-1234567890"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Office Hours
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mon-Fri: 10:00 AM - 12:00 PM"
                  value={formData.office_hours || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, office_hours: e.target.value })
                  }
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editing ? "Update" : "Create"}{" "}
                  Faculty
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({});
                      setEditing(null);
                    }}
                    className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Faculty List</h2>
            <div className="space-y-2">
              {faculty.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-gray-600">
                      {member.designation} - {member.department?.name}
                    </p>
                    {member.room_id && (
                      <p className="text-sm text-primary-600">
                        Room: {member.room_id.room_no} -{" "}
                        {member.room_id.building_id?.name}
                      </p>
                    )}
                    {member.email && (
                      <p className="text-sm text-gray-500">{member.email}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditing(member._id);
                        setFormData({
                          name: member.name || "",
                          department:
                            member.department?._id || member.department || "",
                          designation: member.designation || "",
                          room_id: member.room_id?._id || member.room_id || "",
                          email: member.email || "",
                          phone: member.phone || "",
                          office_hours: member.office_hours || "",
                        });
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete("/faculty", member._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Departments Management */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Add/Edit Department</h2>
            <form
              onSubmit={(e) => handleSubmit(e, "/departments")}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Department Name (e.g., Computer Science & Engineering)"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
                required
              />
              <select
                value={formData.building_id?._id || formData.building_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, building_id: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
                required
              >
                <option value="">Select Building</option>
                {buildings.map((building) => (
                  <option key={building._id} value={building._id}>
                    {building.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.floor_id?._id || formData.floor_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, floor_id: e.target.value || null })
                }
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="">Select Floor (Optional)</option>
                {floors
                  .filter(
                    (floor) =>
                      !formData.building_id ||
                      floor.building_id?._id === formData.building_id ||
                      floor.building_id === formData.building_id
                  )
                  .map((floor) => (
                    <option key={floor._id} value={floor._id}>
                      {floor.floor_name || `Floor ${floor.floor_number}`} -{" "}
                      {floor.building_id?.name}
                    </option>
                  ))}
              </select>
              <textarea
                placeholder="Department Overview (optional)"
                value={formData.overview || ""}
                onChange={(e) =>
                  setFormData({ ...formData, overview: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
                rows="3"
              />
              <textarea
                placeholder="Description (optional)"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded-lg px-4 py-2"
              />
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                {editing ? "Update" : "Create"} Department
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Departments List</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div
                  key={dept._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{dept.name}</p>
                    <p className="text-sm text-gray-600">
                      {dept.building_id?.name}
                    </p>
                    {dept.floor_id && (
                      <p className="text-sm text-gray-500">
                        {dept.floor_id.floor_name ||
                          `Floor ${dept.floor_id.floor_number}`}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditing(dept._id);
                        setFormData({
                          name: dept.name || "",
                          building_id:
                            dept.building_id?._id || dept.building_id || "",
                          floor_id: dept.floor_id?._id || dept.floor_id || "",
                          overview: dept.overview || "",
                          description: dept.description || "",
                        });
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete("r/departments", dept._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "facilities" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Facilities Management</h2>
             
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((facility) => (
              <div key={facility._id} className="p-4 border rounded-lg">
                <p className="font-semibold">{facility.name}</p>
                <p className="text-sm text-gray-600">{facility.type}</p>
                <p className="text-sm text-gray-600">
                  {facility.building_id?.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 