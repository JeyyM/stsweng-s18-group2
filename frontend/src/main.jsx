import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
//
import Authorization from "./Components/Authorization.jsx";

import Login from "./pages/login.jsx";
import CaseFrontend from "./pages/case-report-page/case-frontend.jsx";
import HomeSDW from "./pages/home-sdw.jsx";
import HomeLeader from "./pages/home-leader.jsx";
import Archive from "./pages/archive.jsx";
import WorkerProfile from "./pages/worker-profile.jsx";

import ProgressReport from "./pages/progress-report.jsx";
import CaseClosure from "./pages/case-closure.jsx";
import InterventionForm from "./pages/intervention-forms/main-form.jsx";
import InterventionRoutes from "./Routes/intervention-routes.jsx";
import "./index.css";

import SpuPage from "./pages/spu-page.jsx";

import NotFound from "./pages/not-found.jsx";
import Loading from "./pages/loading.jsx";
import Unauthorized from "./pages/unauthorized.jsx";


//we need to add routes pa here for going to other pages so the actual routes are here we add the module Case to load that page
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/loading" element={<Loading />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                <Route path="/" element={<App />} />
                <Route path="/login" element={<Login />} />

                <Route path="/case-frontend" element={<CaseFrontend />} />
                <Route path="/case/:clientId" element={<CaseFrontend />} />

                <Route path="/create-case" element={<CaseFrontend creating={true} />} />

                {/* <Route path="/home-sdw" element={<HomeSDW />} />
                <Route path="/home-leader" element={<HomeLeader />} /> */}

                {/* <Route path="/home-sdw" element={
                    <Authorization allowedRoles={['sdw']}>
                        <HomeSDW />
                    </Authorization>
                } />

                <Route path="/home-leader" element={
                        <HomeLeader />
                } /> */}

                <Route path="/profile/:workerId" element={<WorkerProfile />} />


                <Route path="/case" element={<HomeSDW />} />
                <Route path="/team" element={<HomeLeader />} />
                <Route path="/archive" element={<Archive />} />

                <Route
                    path="/intervention-form/"
                    element={<InterventionForm />}
                />

                <Route
                    path="/progress-report"
                    element={<ProgressReport />}
                />
                <Route
                    path="/case-closure"
                    element={<CaseClosure />}
                />


                <Route
                    path="/spu"
                    element={<SpuPage />}
                />

                {InterventionRoutes()}

                <Route path="*" element={<NotFound message="Sorry, we couldn't find that page." />} />

            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
);

//