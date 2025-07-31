import { useState, useEffect } from "react";
import SideBar from "../Components/SideBar";
import ClientEntry from "../Components/ClientEntry";
import {
  fetchSession,
  fetchSDWViewById,
  fetchSupervisorView,
  fetchHeadViewBySupervisor,
  fetchHeadViewBySpu,
  fetchHeadView,
} from "../fetch-connections/account-connection";

import { fetchAllSpus } from "../fetch-connections/spu-connection";

import { useNavigate } from "react-router-dom";

function HomeSDW() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [employees, setEmployees] = useState([]);

  const [clients, setClients] = useState([]);
  const [currentSPU, setCurrentSPU] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectLocation, setProjectLocation] = useState([])

  useEffect(() => {
    const loadSession = async () => {
      const sessionData = await fetchSession();
      console.log("Session:", sessionData?.user);
      setUser(sessionData?.user || null);
    };
    loadSession();

    const loadSPUs = async () => {
      const spus = await fetchAllSpus();
      const filtered = spus.filter(
        (spu) => spu.is_active === true
      );
      setProjectLocation(filtered);
    };

    loadSPUs();

  }, []);

  useEffect(() => {
    if (!user) return;

    const loadClients = async () => {
      let data = [];
      if (user.role === "sdw") {
        const res = await fetchSDWViewById(user._id);
        console.log("SDW view:", res);
        data = res || [];
      } else if (user.role === "supervisor") {
        const res = await fetchSupervisorView();
        console.log("Supervisor view:", res);
        data = res.cases || [];
      } else if (user.role === "head") {
        if (currentSPU) {
          const res = await fetchHeadViewBySpu(currentSPU);
          console.log("Head view by SPU:", res);
          data = res.cases || [];
        } else {
          // Head role with no SPU selected → show none
          data = [];
        }
      }
      console.log("Clients loaded:", data);
      setClients(data);
    };

    loadClients();
  }, [user, currentSPU]);

  useEffect(() => {
    const loadUserAndEmployees = async () => {
      const sessionData = await fetchSession();
      console.log("Session:", sessionData);
      setUser(sessionData.user);

      let employees = [];
      if (sessionData.user?.role === "supervisor") {
        const data = await fetchHeadViewBySupervisor(sessionData.user._id);
        employees = data || [];
      }

      console.log("Fetched employees:", employees);
      setEmployees(employees);
    };

    loadUserAndEmployees();

    console.log(employees);
  }, []);

  const getFilteredClients = () => {
    let filtered = [...clients];

    filtered = filtered.filter((c) => c.is_active);

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => {
        const fullName = c.name?.toLowerCase() || "";
        const chNumberStr = c.sm_number?.toString() || "";
        return fullName.includes(query) || chNumberStr.includes(query);
      });
    }

    if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "sm_number") {
      filtered.sort((a, b) => a.sm_number - b.sm_number);
    } else if (sortBy === "pend_term") {
      filtered.sort((a, b) => {
        return (b.pendingTermination === false) - (a.pendingTermination === false);
      });
    }

    if (sortOrder === "desc") {
      filtered.reverse();
    }

    if (user?.role === "supervisor") {
      const allowedIds = employees.map(e => e.id);
      filtered = filtered.filter(c => allowedIds.includes(c.assigned_sdw));
    }

    return filtered;
  };

  const finalClients = getFilteredClients();

  useEffect(() => {
    if (!user) return;

    const title =
      user.role === "head"
        ? "Sponsored Member Cases"
        : `Sponsored Member Cases - ${user.spu_name}`;

    document.title = title;
  }, [user]);



  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-[1280px] mx-auto flex justify-between items-center py-5 px-8 bg-white">
        <a href="/" className="main-logo main-logo-text-nav">
          <div className="main-logo-setup folder-logo"></div>
          <div className="flex flex-col">
            <p className="main-logo-text-nav-sub mb-[-1rem]">Unbound Manila Foundation Inc.</p>
            <p className="main-logo-text-nav">Case Management System</p>
          </div>
        </a>

        <div className="flex gap-5 items-center bg-purple-100 rounded-full px-8 py-4 w-full max-w-[40rem] font-label">
          <div className="nav-search"></div>
          <input
            type="text"
            placeholder="Search"
            className="focus:outline-none flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <main className="min-h-[calc(100vh-4rem)] w-full flex mt-[9rem]">
        <SideBar user={user} />

        <div className="flex flex-col w-full gap-15 ml-[15rem]">
          <h1 className="header-main">{user?.role == "head" ? "Sponsored Member Cases" : `Sponsored Member Cases - ${user?.spu_name}`}</h1>

          <div className="flex justify-between gap-10">
            <div className="flex gap-5 justify-between items-center w-full">
              <div className="flex gap-5 w-full">
                {user?.role === "head" && (
                  <select
                    className="text-input font-label max-w-[30rem]"
                    value={currentSPU}
                    onChange={(e) => setCurrentSPU(e.target.value)}
                  >
                    <option value="">Select SPU</option>
                    {projectLocation.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.spu_name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  className="text-input font-label max-w-[20rem]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">Sort By</option>
                  <option value="name">Name</option>
                  <option value="sm_number">CH Number</option>
                  <option value="pend_term">Pending Termination</option>
                </select>

                <button
                  className="btn-outline font-bold-label"
                  onClick={() =>
                    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
                  }
                >
                  <div className="icon-static-setup order-button"></div>
                </button>
              </div>

              {user?.role === "sdw" && (
                <button
                  onClick={() => navigate("/create-case")}
                  className="btn-outline font-bold-label flex gap-4 whitespace-nowrap"
                >
                  <p>+</p>
                  <p>New Case</p>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col w-full gap-3">
            <div className="grid grid-cols-[2fr_1fr_2fr] items-center border-b border-gray-400 pb-2 mb-2">
              <p className="font-bold-label ml-[20%]">Name</p>
              <p className="font-bold-label text-center">CH Number</p>
              <p className="font-bold-label text-center">SDW Assigned</p>
            </div>

            {user?.role === "head" && currentSPU === "" ? (
              <p className="font-bold-label mx-auto">
                No Sub-Project Unit Selected
              </p>
            ) : finalClients.length === 0 ? (
              <p className="font-bold-label mx-auto">No Clients Found</p>
            ) : (
              finalClients.map((client) => (
                <ClientEntry
                  key={client.id}
                  id={client.id}
                  sm_number={client.sm_number}
                  spu={client.spu}
                  name={client.name}
                  assigned_sdw_name={client.assigned_sdw_name}
                  pendingTermination={client.pendingTermination ?? false}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default HomeSDW;
