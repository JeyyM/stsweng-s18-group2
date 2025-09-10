import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../Components/SideBar";
import WorkerEntry from "../Components/WorkerEntry";
import RegisterWorker from "../Components/RegisterWorker";
import Loading from "./loading";

import {
  fetchHeadViewBySpu,
  fetchHeadViewBySupervisor,
  fetchSession
} from "../fetch-connections/account-connection";

import { fetchAllSpus } from "../fetch-connections/spu-connection";

function HomeLeader() {
  const navigate = useNavigate();

  const [allData, setAllData] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [currentSPU, setCurrentSPU] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [projectLocation, setProjectLocation] = useState([]);

  const [loadingStage, setLoadingStage] = useState(0); // 0 = red, 1 = blue, 2 = green
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingStage(0); // Start: red
        const sessionData = await fetchSession();
        setUser(sessionData.user);
        if (!sessionData.user || !["head", "supervisor"].includes(sessionData.user.role)) {
          navigate("/unauthorized");
          return;
        }

        setLoadingStage(1); // Mid: blue

        let employees = [];

        if (sessionData.user.role === "head") {
          const data = currentSPU
            ? await fetchHeadViewBySpu(currentSPU)
            : { employees: [] };
          employees = data.employees || [];
        } else if (sessionData.user.role === "supervisor") {
          const data = await fetchHeadViewBySupervisor(sessionData.user._id);
          employees = data || [];
        }

        const filtered = employees.filter(e => e.is_active === true);
        setAllData(filtered);

        const spus = await fetchAllSpus();
        const activeSpus = spus.filter(spu => spu.is_active === true);
        setProjectLocation(activeSpus);

        setLoadingStage(2); // Final: green

        setLoadingComplete(true);
      } catch (err) {
        console.error("Error during data load", err);
        navigate("/unauthorized");
      }
    };

    loadData();
  }, [currentSPU, isRegisterOpen]);

useEffect(() => {
  let filtered = [...allData];

  if (currentSPU !== "") {
    filtered = filtered.filter((w) => w.spu_id === currentSPU);
  }

  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((w) => {
      const name = `${w.name}`.toLowerCase();
      const idStr = w.sdw_id?.toString() || "";
      return name.includes(query) || idStr.includes(query);
    });
  }

  // Role priority mapping
  const roleOrder = {
    head: 3,
    supervisor: 2,
    sdw: 1
  };

  // Always sort by role priority first, then name
  filtered.sort((a, b) => {
    const roleA = roleOrder[a.role?.toLowerCase()] ?? 99;
    const roleB = roleOrder[b.role?.toLowerCase()] ?? 99;

    if (roleA !== roleB) {
      return roleA - roleB;
    }
    return (a.name || "").localeCompare(b.name || "");
  });

  // Optional: apply manual reverse if user toggles
  if (sortOrder === "desc") {
    filtered.reverse();
  }

  setCurrentData(filtered);
}, [allData, currentSPU, sortBy, sortOrder, searchQuery]);


  useEffect(() => {
    if (!user) return;

    const title =
      user.role === "supervisor"
        ? `Coordinating Unit - ${user.spu_name}`
        : "Coordinating Unit";

    document.title = title;
  }, [user]);

  // Determine color for Loading component
  const loadingColor = loadingStage === 0 ? "red" : loadingStage === 1 ? "blue" : "green";

  if (!loadingComplete) {
    return <Loading color={loadingColor} />;
  }
  return (
    <>
      <RegisterWorker
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={(newWorker) => {
          // console.log("New worker added:", newWorker);
        }}
      />

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

          <h1 className="header-main">
            {user?.role === "head"
              ? "Coordinating Unit"
              : `Coordinating Unit${user?.spu_name ? ` - ${user.spu_name}` : ""}`}
          </h1>


          <div className="flex justify-between gap-10">
            <div className="flex gap-5 justify-between items-center w-full">
              <div className="flex gap-5 w-full">
                {user?.role == "head" && (
                  <select
                    className="text-input font-label max-w-[30rem]"
                    value={currentSPU}
                    onChange={(e) => setCurrentSPU(e.target.value)}
                  >
                    <option value="">Select SPU</option>
                    {projectLocation.map((spu) => (
                      <option key={spu._id} value={spu.spu_name}>
                        {spu.spu_name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  className="text-input font-label max-w-[23rem]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">Find By</option>
                  <option value="name">Name</option>
                  <option value="head">Head</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="sdw">Social Development Worker</option>
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

              {user?.role == "head" && (
                <button
                  className="btn-outline font-bold-label flex gap-4 whitespace-nowrap"
                  onClick={() => setIsRegisterOpen(true)}
                  disabled={isRegisterOpen}
                >
                  <p>+</p>
                  <p>Add Account</p>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col w-full gap-3">
            <div className="grid grid-cols-[2fr_1fr_2fr] items-center border-b border-gray-400 pb-2 mb-2">
              <p className="font-bold-label ml-[20%]">Worker</p>
              <p className="font-bold-label text-center">Type</p>
              <p className="font-bold-label text-center">SPU</p>
            </div>

            {user?.role === "head" && currentSPU === "" ? (
              <p className="font-bold-label mx-auto">
                No Sub-Project Unit Selected
              </p>
            ) : currentData.length === 0 ? (
              <p className="font-bold-label mx-auto">No Workers Found</p>
            ) : (
              currentData.map((worker) => (
                <WorkerEntry
                  key={worker.id}
                  id={worker.id}
                  // sdw_id={worker.sdw_id}
                  name={worker.name}
                  role={worker.role}
                  spu_id={worker.spu_id}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default HomeLeader;
