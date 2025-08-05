import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useParams } from "react-router-dom";
import FamilyCard from "../../Components/FamilyCard";
import SimpleModal from '../../Components/SimpleModal';
import NavLabelButton from '../../components/NavLabelButton';

import { fetchSession } from "../../fetch-connections/account-connection";
import { createNewCase } from "../../fetch-connections/case-connection";

import { fetchAllSpus } from "../../fetch-connections/spu-connection";
import NotFound from "../not-found";
import Loading from "../loading";

// API Imports
import {
    fetchCaseData,
    fetchFamilyMembers,
    fetchCaseBySMNumber,
    editProblemsFindings,
    editAssessment,
    editEvalReco,
    updateCoreCaseData,
    updateIdentifyingCaseData,
    fetchSDWs,
}
    from '../../fetch-connections/case-connection';

// Financial Intervention API Imports
import {
    fetchAllFinInterventions
} from "../../fetch-connections/financialForm-connection";

// Counselling Intervention API Imports
import {
    fetchAllCounselingInterventionsByMemberId
} from "../../fetch-connections/intervention-connection";

// Counselling Intervention API Imports
import {
    fetchAllCorrespInterventions
} from "../../fetch-connections/correspFormConnection";

// Progress Reports API Imports
import {
    fetchProgressReportsForCase
} from "../../fetch-connections/progress-report-connection";

// Case Closure API Imports
import {
    fetchCaseClosureData
} from "../../fetch-connections/caseClosure-connection";

import { fetchAllHomeVisitForms } from "../../fetch-connections/homeVisitation-connection";

// Case Download Import
import {
    generateCaseReport
} from "../../generate-documents/generate-documents";

function CaseFrontend({ creating = false }) {
    // console.log(creating);

    const navigate = useNavigate();
    const { clientId } = useParams();
    const [user, setUser] = useState(null);
    const [loadingStage, setLoadingStage] = useState(0);
    const [loadingComplete, setLoadingComplete] = useState(false);

    const [data, setData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        sm_number: "",
        sex: "",
        dob: "",
        civil_status: "",
        edu_attainment: "",
        occupation: "",
        pob: "",
        religion: "",
        contact_no: "",
        present_address: "",
        problem_presented: "",
        observation_findings: "",
        recommendation: "",
        history_problem: "",
        evaluation: "",
        is_active: "",
        assessment: "",
        assigned_sdw: "",
        spu: "",
        classifications: "",

        pendingTermination: false
    });

    const [familyMembers, setFamilyMembers] = useState([]);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(creating ? false : true);
    const [isTerminated, setIsTerminated] = useState(false);

    useEffect(() => {
        const loadCaseData = async () => {
            if (!clientId) return;

            const fetchedData = await fetchCaseData(clientId);
            // console.log("FETCHED DATA", fetchedData);

            if (!fetchedData || fetchedData.sm_number === "") {
                setNotFound(true);
                setLoading(false);
                return;
            }

            if (!fetchedData.pendingTermination && !fetchedData.is_active)
                setIsTerminated(true)

            setData({
                ...fetchedData,
                assigned_sdw: fetchedData.assigned_sdw?._id || ""
            });

            setDrafts({
                first_name: fetchedData.first_name || "",
                middle_name: fetchedData.middle_name || "",
                last_name: fetchedData.last_name || "",
                sm_number: fetchedData.sm_number || "",
                spu: fetchedData.spu || "",
                assigned_sdw: fetchedData.assigned_sdw._id || "",
                classifications: fetchedData.classifications || "",

                dob: fetchedData.dob || "",
                civil_status: fetchedData.civil_status || "",
                edu_attainment: fetchedData.edu_attainment || "",
                sex: fetchedData.sex || "",
                pob: fetchedData.pob || "",
                religion: fetchedData.religion || "",
                occupation: fetchedData.occupation || "",
                present_address: fetchedData.present_address || "",
                contact_no: fetchedData.contact_no || "",

                problem_presented: fetchedData.problem_presented || "",
                history_problem: fetchedData.history_problem || "",
                observation_findings: fetchedData.observation_findings || "",
                assessment: fetchedData.assessment || "",
                recommendation: fetchedData.recommendation || "",
                evaluation: fetchedData.evaluation || "",
            });

            setAge(calculateAge(fetchedData.dob));
            if (!creating && fetchedData && fetchedData.sm_number !== "") {
                setLoadingStage(1); // case data successfully fetched
            }
        };

        const loadFamilyData = async () => {
            if (!clientId) return;

            const fetchedData = await fetchFamilyMembers(clientId);
            setFamilyMembers(fetchedData);
        };

        loadCaseData();
        loadFamilyData();
    }, [clientId]);

    const [projectLocation, setProjectLocation] = useState([])
    const [socialDevelopmentWorkers, setSocialDevelopmentWorkers] = useState([]);

    useEffect(() => {
        const loadSDWs = async () => {
            const sdws = await fetchSDWs();

            const filtered = sdws.filter(
                (sdws) => sdws.is_active === true
            );
            setSocialDevelopmentWorkers(filtered);

            // console.log("LOADING SDW", sdws);

            const loadSPUs = async () => {
                const spus = await fetchAllSpus();

                const filtered = spus.filter(
                    (spu) => spu.is_active === true
                );
                setProjectLocation(filtered);
            };
            loadSPUs();
        };
        loadSDWs();
    }, []);

    const [classificationList, setClassificationList] = useState([
        "Child",
        "Youth",
        "Older Adult"
    ]);

    const [age, setAge] = useState(calculateAge(data?.dob));

    const [drafts, setDrafts] = useState({
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        last_name: data.last_name || "",
        sm_number: data.sm_number || "",
        spu: data.spu || "",
        assigned_sdw: data.assigned_sdw || "",
        classifications: data.classifications || "",
        is_active: data.is_active || "",

        dob: data.dob || "",
        civil_status: data.civil_status || "",
        edu_attainment: data.edu_attainment || "",
        sex: data.sex || "",
        pob: data.pob || "",
        religion: data.religion || "",
        occupation: data.occupation || "",
        present_address: data.present_address || "",
        contact_no: data.contact_no || "",

        problem_presented: data.problem_presented || "",
        history_problem: data.history_problem || "",
        observation_findings: data.observation_findings || "",
        assessment: data.assessment || "",
        recommendation: data.recommendation || "",
        evaluation: data.evaluation || "",
    });

    const resetFields = () => {
        // console.log("RESET FIEDLS", data.assigned_sdw._id);
        setDrafts({
            first_name: data.first_name || "",
            middle_name: data.middle_name || "",
            last_name: data.last_name || "",
            sm_number: data.sm_number || "",
            spu: data.spu || "",
            assigned_sdw: data.assigned_sdw || "",
            classifications: data.classifications || "",

            dob: data.dob || "",
            civil_status: data.civil_status || "",
            edu_attainment: data.edu_attainment || "",
            sex: data.sex || "",
            pob: data.pob || "",
            religion: data.religion || "",
            occupation: data.occupation || "",
            present_address: data.present_address || "",
            contact_no: data.contact_no || "",

            problem_presented: data.problem_presented || "",
            history_problem: data.history_problem || "",
            observation_findings: data.observation_findings || "",
            assessment: data.assessment || "",
            recommendation: data.recommendation || "",
            evaluation: data.evaluation || "",
        });
        setEditingField(null);
    };


    useEffect(() => {
        setAge(calculateAge(drafts.dob));
    }, [drafts.dob]);

    useEffect(() => {
        if (data.first_name && data.last_name) {
            document.title = `${data.first_name} ${data.last_name}'s Case`;
        } else {
            document.title = `Case Page`;
        }
    }, [data]);

    const [ref1, inView1] = useInView({ threshold: 0.5 });
    const [ref2, inView2] = useInView({ threshold: 0.5 });
    const [ref3, inView3] = useInView({ threshold: 0.5 });
    const [ref4, inView4] = useInView({ threshold: 0.5 });
    const [ref5, inView5] = useInView({ threshold: 0.5 });
    const [ref6, inView6] = useInView({ threshold: 0.5 });

    useEffect(() => {
        if (inView1) setCurrentSection("identifying-data");
        else if (inView2) setCurrentSection("family-composition");
        else if (inView3) setCurrentSection("problems-findings");
        else if (inView4) setCurrentSection("interventions");
        else if (inView5) setCurrentSection("assessments");
        else if (inView6) setCurrentSection("evaluation-recommendation");
    }, [inView1, inView2, inView3, inView4, inView5, inView6]);

    const sliderRef = useRef(null);

    useEffect(() => {
        const loadSession = async () => {
            const sessionData = await fetchSession();
            const currentUser = sessionData?.user || null;
            setUser(currentUser);
            // console.log("Session:", currentUser);
        };
        loadSession();

        if (
            creating &&
            user &&
            projectLocation.length > 0 &&
            socialDevelopmentWorkers.length > 0
        ) {
            const matchSPU = projectLocation.find(p => p._id === user.spu_id);
            const validSDW = socialDevelopmentWorkers.find(
                sdw =>
                    (sdw.id === user._id || sdw._id === user._id) &&
                    sdw.spu_id === matchSPU?.spu_name &&
                    sdw.role === "sdw"
            );

            if (matchSPU && validSDW) {
                setDrafts(prev => ({
                    ...prev,
                    spu: matchSPU._id,
                    assigned_sdw: validSDW.id,
                }));
            }
        }

        if (creating) {
            setLoadingStage(2);
            setLoadingComplete(true);
        }
    }, [creating]);

    useEffect(() => {
        if (
            creating &&
            user &&
            projectLocation.length > 0 &&
            socialDevelopmentWorkers.length > 0
        ) {
            const matchSPU = projectLocation.find(p => p._id === user.spu_id);
            const validSDW = socialDevelopmentWorkers.find(
                sdw =>
                    (sdw.id === user._id || sdw._id === user._id) &&
                    sdw.spu_id === matchSPU?.spu_name &&
                    sdw.role === "sdw"
            );

            // console.log("SPU", matchSPU, "SDW", socialDevelopmentWorkers);

            if (matchSPU && validSDW) {
                setDrafts(prev => ({
                    ...prev,
                    spu: matchSPU._id,
                    assigned_sdw: validSDW.id,
                }));
            }
        }
    }, [creating, user, projectLocation, socialDevelopmentWorkers]);

    function calculateAge(dateValue) {
        const birthday = new Date(dateValue);
        const today = new Date();

        let age = today.getFullYear() - birthday.getFullYear();

        const birthdayDone =
            today.getMonth() > birthday.getMonth() ||
            (today.getMonth() === birthday.getMonth() &&
                today.getDate() >= birthday.getDate());

        if (!birthdayDone) {
            age--;
        }

        return age;
    }

    const [editingField, setEditingField] = useState(null);
    useEffect(() => {
        if (creating) {
            setEditingField("all");
        }
    }, [creating]);

    const [currentSection, setCurrentSection] = useState("identifying-data");

    const [selectedFamily, setSelectedFamily] = useState(null);
    const [editingFamilyValue, setEditingFamilyValue] = useState({});

    const [familyToDelete, setFamilyToDelete] = useState(null);
    const [familyConfirm, setFamilyConfirm] = useState(false);

    const [showModal, setShowModal] = useState(false);

    const [forceSubmitAfterConfirm, setForceSubmitAfterConfirm] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalBody, setModalBody] = useState("");
    const [modalConfirm, setModalConfirm] = useState(false);
    const [modalOnConfirm, setModalOnConfirm] = useState(() => { });
    const [modalOnClose, setModalOnClose] = useState(() => null);
    const [modalImageCenter, setModalImageCenter] = useState(null);

    function formatListWithAnd(arr) {
        if (arr.length === 0) return "";
        if (arr.length === 1) return arr[0];
        if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
        const last = arr[arr.length - 1];
        return `${arr.slice(0, -1).join(", ")}, and ${last}`;
    }

    function showSuccess(message) {
        setModalTitle('Success!');
        setModalBody(message);
        setModalImageCenter(<div className='success-icon mx-auto'></div>);
        setModalConfirm(false);
        setShowModal(true);
    }

    const [showSupervisorWarning, setShowSupervisorWarning] = useState(false);

    const checkCore = async () => {
        const missing = [];

        if (!drafts.first_name || drafts.first_name.trim() === "") {
            missing.push("First Name");
        } else if (/\d/.test(drafts.first_name)) {
            missing.push("First Name must not contain numbers");
        }

        if (/\d/.test(drafts.middle_name)) {
            missing.push("Middle Name must not contain numbers");
        }

        if (!drafts.last_name || drafts.last_name.trim() === "") {
            missing.push("Last Name");
        } else if (/\d/.test(drafts.last_name)) {
            missing.push("Last Name must not contain numbers");
        }

        if (!drafts.sm_number) {
            missing.push("CH Number");
        } else if (isNaN(Number(drafts.sm_number))) {
            missing.push("CH Number must only be numeric");
        } else if (Number(drafts.sm_number) < 0) {
            missing.push("CH Number cannot be negative");
        }

        if (drafts.sm_number) {
            const check = await fetchCaseBySMNumber(Number(drafts.sm_number));
            if (check.found && String(check.data.sm_number).trim() !== String(data.sm_number).trim()) {
                missing.push(`CH Number already exists and belongs to another case`);
            }
        }

        if (!drafts.spu) missing.push("SPU Project");
        if (!drafts.assigned_sdw) missing.push("Social Development Worker");
        if (drafts.classifications === "") missing.push("Classification");

        const selectedSPUName = projectLocation.find(spu => spu._id === drafts.spu)?.spu_name;

        const validSDWIds = socialDevelopmentWorkers
            .filter(sdw => sdw.spu_id === selectedSPUName && sdw.role === "sdw")
            .map(sdw => sdw.id);

        if (drafts.assigned_sdw && !validSDWIds.includes(drafts.assigned_sdw)) {
            missing.push("valid Social Development Worker for selected SPU");
        }

        if (missing.length > 0) {
            setModalTitle("Invalid Fields");
            setModalBody(`The following fields are missing or invalid: ${formatListWithAnd(missing)}`);
            setModalImageCenter(<div className="warning-icon mx-auto" />);
            setModalConfirm(false);
            setShowModal(true);
            return false;
        }

        // Supervisor warning
        if (user?.role === "supervisor") {
            const selectedSDW = socialDevelopmentWorkers.find(
                sdw => sdw.spu_id === selectedSPUName && sdw.id === drafts.assigned_sdw
            );

            if (selectedSDW && selectedSDW.manager !== user._id) {
                return "pending-super-confirm";
            }
        }

        return true;
    };

    const checkProblems = async () => {
        const missing = [];

        if (!drafts.problem_presented || drafts.problem_presented.trim() === "") {
            missing.push("Problem Presented");
        }

        if (!drafts.history_problem || drafts.history_problem.trim() === "") {
            missing.push("History of the Problem");
        }

        if (!drafts.observation_findings || drafts.observation_findings.trim() === "") {
            missing.push("Findings");
        }

        if (missing.length > 0) {
            setModalTitle("Invalid Fields");
            setModalBody(`The following fields are missing or invalid: ${formatListWithAnd(missing)}`);
            setModalImageCenter(<div className="warning-icon mx-auto"></div>);
            setModalConfirm(false);
            setShowModal(true);
            return false;
        }

        return true;
    };

    const checkAssessment = async () => {
        const missing = [];

        if (!drafts.assessment || drafts.assessment.trim() === "") {
            missing.push("Assessment");
        }

        if (missing.length > 0) {
            setModalTitle("Invalid Fields");
            setModalBody(`The following fields are missing or invalid: ${formatListWithAnd(missing)}`);
            setModalImageCenter(<div className="warning-icon mx-auto"></div>);
            setModalConfirm(false);
            setShowModal(true);
            return false;
        }

        return true;
    };

    const checkEvaluations = async () => {
        const missing = [];

        if (!drafts.evaluation || drafts.evaluation.trim() === "") {
            missing.push("Evaluation");
        }

        if (!drafts.recommendation || drafts.recommendation.trim() === "") {
            missing.push("Recommendation");
        }

        if (missing.length > 0) {
            setModalTitle("Invalid Fields");
            setModalBody(`The following fields are missing or invalid: ${formatListWithAnd(missing)}`);
            setModalImageCenter(<div className="warning-icon mx-auto"></div>);
            setModalConfirm(false);
            setShowModal(true);
            return false;
        }

        return true;
    };

    useEffect(() => {
        const validSDWIds = socialDevelopmentWorkers
            .filter((sdw) => sdw.spu_id === drafts.spu)
            .map((sdw) => sdw.id);

        if (drafts.assigned_sdw && !validSDWIds.includes(drafts.assigned_sdw)) {
            setDrafts((prev) => ({
                ...prev
            }));
        }
    }, [drafts.spu, drafts.assigned_sdw, socialDevelopmentWorkers]);


    function checkIdentifying() {
        const missing = [];

        if (!drafts.dob) {
            missing.push('Date of Birth');
        } else {
            const selectedDate = new Date(drafts.dob);
            const today = new Date();
            if (selectedDate > today) {
                missing.push('Date of Birth cannot be in the future');
            }
        }

        if (!drafts.sex) {
            missing.push('Sex');
        }

        if (!drafts.civil_status) {
            missing.push('Civil Status');
        }

        if (!drafts.present_address || drafts.present_address.trim() === "") {
            missing.push("Present Address");
        }

        if (!drafts.pob || drafts.pob.trim() === "") {
            missing.push("Place of Birth");
        }

        if (drafts.contact_no && !/^\d{11}$/.test(drafts.contact_no)) {
            missing.push("Contact Number must be 11 numerical digits");
        }

        if (missing.length > 0) {
            setModalTitle('Invalid Fields');
            setModalBody(`The following fields are missing or invalid: ${formatListWithAnd(missing)}`);
            setModalImageCenter(<div className="warning-icon mx-auto"></div>);
            setModalConfirm(false);
            setShowModal(true);
            return false;
        }

        return true;
    }

    const handleAddFamilyMember = () => {
        const newMember = {
            first: "",
            middle: "",
            last: "",
            age: "",
            income: "",
            civilStatus: "",
            occupation: "",
            education: "",
            relationship: "",
            status: "Living",
            newlyCreated: true,
        };

        setFamilyMembers((prev) => [newMember, ...prev]);
        setSelectedFamily(0);
        setEditingFamilyValue(newMember);
    };

    const handleDeleteFamilyMember = (familyToDelete) => {
        const updated = familyMembers.filter(
            (member) => member.id !== familyToDelete,
        );
        setFamilyMembers(updated);
        setFamilyToDelete(null);
        setFamilyConfirm(false);
        setSelectedFamily(null);
    };

    const [intervention_selected, setInterventionSelected] = useState("");

    const [home_visitations, setHomeVisitations] = useState([]);
    useEffect(() => {
        const loadData = async () => {
            const fetchedHomeVisitData = await fetchAllHomeVisitForms(clientId);
            // console.log("Fetched Home Visit: ", fetchedHomeVisitData);

            const formatter = new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: 'long',
                day: '2-digit',
            });

            const homeVisitInterventions = fetchedHomeVisitData.interventions.map(item => {
                const createdAt = item.intervention?.createdAt;
                let dateLabel = "No Date Available";

                if (createdAt) {
                    const date = new Date(createdAt);
                    if (!isNaN(date)) {
                        dateLabel = formatter.format(date);
                    }
                }

                return {
                    formID: item.intervention._id,
                    route: "home-visitation-form",
                    intervention: item.interventionType,
                    date: dateLabel,
                };
            });
            // console.log("Home Visitation Forms: ", homeVisitInterventions);
            setHomeVisitations(homeVisitInterventions);
        };
        loadData();
    }, []);

    const [counsellings, setCounsellings] = useState([]);
    useEffect(() => {
        const loadData = async () => {
            const fetchedCounsellingData = await fetchAllCounselingInterventionsByMemberId(clientId);
            //console.log("Fetched Counselling: ", fetchedCounsellingData);

            const formatter = new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: 'long',
                day: '2-digit',
            });

            const counsellingInterventions = fetchedCounsellingData.interventions.map(item => {
                const createdAt = item.intervention?.createdAt;
                let dateLabel = "No Date Available";

                if (createdAt) {
                    const date = new Date(createdAt);
                    if (!isNaN(date)) {
                        dateLabel = formatter.format(date);
                    }
                }

                return {
                    formID: item.intervention._id,
                    route: "counselling-form",
                    intervention: item.interventionType,
                    date: dateLabel,
                };
            });

            //console.log("Counselling Data: ", counsellingInterventions);
            setCounsellings(counsellingInterventions);
        };
        loadData();
    }, []);

    const [financial_assistances, setFinancialAssistances] = useState([]);
    useEffect(() => {
        const loadData = async () => {
            const fetchedFinancialData = await fetchAllFinInterventions(clientId);
            //console.log("Fetched Financial: ", fetchedFinancialData);

            const formatter = new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: 'long',
                day: '2-digit',
            });

            const financialInterventions = fetchedFinancialData.map(item => {
                const createdAt = item.intervention?.createdAt || item.createdAt;
                let dateLabel = "No Date Available";

                if (createdAt) {
                    const date = new Date(createdAt);
                    if (!isNaN(date)) {
                        dateLabel = formatter.format(date);
                    }
                }

                return {
                    formID: item.id,
                    route: "financial-assessment-form",
                    intervention: "Financial Assistance",
                    date: dateLabel,
                };
            });

            //console.log("Financial Data: ", financialInterventions);
            setFinancialAssistances(financialInterventions);
        };
        loadData();
    }, []);

    const [correspondences, setCorrespondences] = useState([]);
    useEffect(() => {
        const loadData = async () => {
            const fetchedCorrespondenceData = await fetchAllCorrespInterventions(clientId);
            //console.log("Fetched Correspondence: ", fetchedCorrespondenceData);

            const formatter = new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: 'long',
                day: '2-digit',
            });

            const correspondenceInterventions = fetchedCorrespondenceData.map(item => {
                const createdAt = item.intervention?.createdAt || item?.createdAt;
                let dateLabel = "No Date Available";

                if (createdAt) {
                    const date = new Date(createdAt);
                    if (!isNaN(date)) {
                        dateLabel = formatter.format(date);
                    }
                }

                return {
                    formID: item.id,
                    route: "correspondence-form",
                    intervention: "Correspondence",
                    date: dateLabel,
                };
            });

            //console.log("Correspondence Data: ", correspondenceInterventions);
            setCorrespondences(correspondenceInterventions);
        };
        loadData();
    }, []);

    const interventions = {
        "Home Visitation": home_visitations,
        "Counselling": counsellings,
        "Financial Assistance": financial_assistances,
        "Correspondences": correspondences,
    };

    const [progress_reports, setProgressReports] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const fetchedProgressData = await fetchProgressReportsForCase(clientId);
            //console.log("Fetched Progress Reports: ", fetchedProgressData);

            const formatter = new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: 'long',
                day: '2-digit',
            });

            const progressReportsData = fetchedProgressData.map(item => {
                const date = new Date(item.created_at);

                return {
                    formID: item._id,
                    name: "Progress Report",
                    route: "progress-reports",
                    date: isNaN(date) ? '' : formatter.format(date),
                };
            });

            //console.log("Progress Report Data: ", progressReportsData);

            setProgressReports(progressReportsData);
        };

        loadData();
    }, []);

    const [caseClosureForm, setCaseClosureForm] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            const fetchedClosureForm = await fetchCaseClosureData(clientId);
            // console.log("Fetched Closure Form: ", fetchedClosureForm);

            const closureForm = fetchedClosureForm.form
            // console.log("Closure Form Data: ", closureForm);

            if (caseClosureForm && closureForm.status == "Accepted" && data.is_active == false)
                setIsTerminated(true)
            setCaseClosureForm(closureForm);
        };

        loadData();
    }, []);

    const handleNewIntervention = (caseID) => {
        const path = `/intervention-form/?action=create&caseID=${caseID}`;
        navigate(path);
        // navigate(`/intervention-form?selected=${encodeURIComponent(key)}`);
    };

    const handleNewProgressReport = (caseID) => {
        const path = `/progress-report/?action=create&caseID=${caseID}`;
        navigate(path);
        // navigate(`/intervention-form?selected=${encodeURIComponent(key)}`);
    };

    const handleCaseTermination = (caseID) => {
        const path = `/case-closure/?action=create&caseID=${caseID}`;
        navigate(path);
        // navigate(`/intervention-form?selected=${encodeURIComponent(key)}`);
    };

    const handleViewCaseTermination = (caseID) => {
        const path = `/case-closure/?action=view&caseID=${caseID}`;
        navigate(path);
        // navigate(`/intervention-form?selected=${encodeURIComponent(key)}`);
    };

    const handleInterventionNavigation = (intervention, caseID, formID) => {
        const path = `/${intervention}/?action=view&caseID=${caseID}&formID=${formID}`;
        navigate(path);
        // navigate(`/intervention-form?selected=${encodeURIComponent(key)}`);
    };

    const handleProgressReportNavigation = (caseID, formID) => {
        const path = `/progress-report/?action=view&caseID=${caseID}&formID=${formID}`;
        navigate(path);
        // navigate(`/intervention-form?selected=${encodeURIComponent(key)}`);
    };

    const [confirmCreateModal, setConfirmCreateModal] = useState(false);

    const submitNewCase = async () => {
        const coreValid = await checkCore();

        if (!coreValid) {
            setModalOnConfirm(() => () => {
                document.getElementById("core-fields")?.scrollIntoView({ behavior: "smooth" });
            });
            return;
        }

        const identifyingValid = checkIdentifying();

        if (!identifyingValid) {
            setModalOnConfirm(() => () => {
                document.getElementById("identifying-data")?.scrollIntoView({ behavior: "smooth" });
            });
            return;
        }

        const problemsValid = await checkProblems();

        if (!problemsValid) {
            setModalOnConfirm(() => () => {
                document.getElementById("problems-findings")?.scrollIntoView({ behavior: "smooth" });
            });
            return;
        }

        const assesssmentValid = await checkAssessment();

        if (!assesssmentValid) {
            setModalOnConfirm(() => () => {
                document.getElementById("assessments")?.scrollIntoView({ behavior: "smooth" });
            });
            return;
        }

        const evaluationsValid = await checkEvaluations();

        if (!evaluationsValid) {
            setModalOnConfirm(() => () => {
                document.getElementById("evaluation-recommendatioon")?.scrollIntoView({ behavior: "smooth" });
            });
            return;
        }

        setModalTitle("Confirm Creation");
        setModalBody("Are you sure you want to create this client? Important fields will no longer become editable once created. Once made, cases can no longer be deleted.");
        setModalImageCenter(<div className="info-icon mx-auto" />);
        setModalConfirm(true);
        setModalOnConfirm(() => async () => {
            const payload = {
                ...drafts,
                is_active: true,
            };

            const { ok, data } = await createNewCase(payload);

            if (ok && data?.case?._id) {
                setModalTitle("Success!");
                setModalBody("New case created successfully.");
                setModalImageCenter(<div className="success-icon mx-auto" />);
                setModalConfirm(false);
                setModalOnConfirm(() => () => navigate(`/`));
            } else {
                console.error("Invalid _id:", data.case);
                setModalTitle("Error");
                setModalBody(data.message || "An unexpected error occurred.");
                setModalImageCenter(<div className="warning-icon mx-auto" />);
                setModalConfirm(false);
                setModalOnConfirm(() => () => { });
            }

            setShowModal(true);
        });
        setShowModal(true);
    };

    const handleSubmitCoreUpdate = async () => {
        try {
            const updated = await updateCoreCaseData(drafts, clientId);

            setData((prev) => ({
                ...prev,
                first_name: updated.first_name || drafts.first_name,
                middle_name: updated.middle_name || drafts.middle_name,
                last_name: updated.last_name || drafts.last_name,
                sm_number: updated.sm_number || drafts.sm_number,
                spu: updated.spu || drafts.spu,
                assigned_sdw: updated.assigned_sdw || drafts.assigned_sdw,
                classifications: updated.classifications || drafts.classifications,
            }));

            setEditingField(null);
            showSuccess("Core details were successfully updated!");

            if (user?.role === "supervisor") {
                setTimeout(() => {
                    window.location.href = "/";
                }, 500);
            }
        } catch (error) {
            setModalTitle("Update Error");
            setModalBody(error.message || "An unexpected error occurred.");
            setModalImageCenter(<div className="warning-icon mx-auto" />);
            setModalConfirm(false);
            setShowModal(true);
        }
    };


    const [unauthorized, setUnauthorized] = useState(false);
    useEffect(() => {
        // Wait for all needed data to load
        if (!user || (!creating && !data.assigned_sdw) || socialDevelopmentWorkers.length === 0) return;

        const isHead = user.role === "head";
        const isSDW = user.role === "sdw";
        const isSupervisor = user.role === "supervisor";

        // console.log("Auth workers", data, socialDevelopmentWorkers);

        if (creating) {
            // Only SDWs can create
            if (!isSDW) {
                setUnauthorized(true);
            }
            return;
        }

        const assignedSDWId = data.assigned_sdw;

        // console.log("found assigned SDW", assignedSDWId);

        const isAssignedSDW = user._id === assignedSDWId;

        // console.log(isAssignedSDW);

        const managesAssignedSDW = socialDevelopmentWorkers.some(
            (w) =>
                (w._id === assignedSDWId || w.id === assignedSDWId) &&
                w.manager === user._id
        );

        // console.log(managesAssignedSDW);

        if (!(isHead || isAssignedSDW || managesAssignedSDW)) {
            setUnauthorized(true);
        }
        setLoadingStage(2);
        setLoadingComplete(true);
    }, [user, data.assigned_sdw, creating, socialDevelopmentWorkers]);

    if (!loadingComplete) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="loader-conic"></div>
            </div>
        );
    }


    if (unauthorized) {
        return (
            <div className="flex flex-col w-full gap-15 justify-center items-center transform -translate-y-[-20vh]">

                <div className="flex gap-10 items-center justify-center">
                    <div className="main-logo-setup unauthorized-logo !w-[6rem] !h-[8rem]"></div>
                    <h1 className="main-logo-text-nav !text-[4rem]">Unauthorized</h1>
                </div>
                <p className="font-label">You do not have permission to access this page.</p>
                <button
                    onClick={() => navigate("/")}
                    className="btn-primary font-bold-label"
                >
                    Go Home
                </button>
            </div>
        );
    }


    return (
        <>
            {notFound ? (
                <NotFound message="The profile you are looking for does not exist." />
            ) : (
                <>
                    <SimpleModal
                        isOpen={showModal}
                        onClose={() => {
                            setShowModal(false);
                            setModalTitle("");
                            setModalBody("");
                            setModalImageCenter(null);
                            setModalConfirm(false);
                            setModalOnConfirm(() => { });
                        }}
                        title={modalTitle}
                        bodyText={modalBody}
                        imageCenter={modalImageCenter}
                        confirm={modalConfirm}
                        onConfirm={() => {
                            modalOnConfirm?.();
                            setShowModal(false);
                        }}
                    />

                    <main className="flex flex-col gap-20 py-15">
                        {/* <div className='flex flex-1 top-0 justify-between fixed bg-white z-98 max-w-[1280px] py-3 mx-auto'> */}
                        <div className="fixed top-0 right-0 left-0 z-50 mx-auto flex w-full max-w-[1280px] items-center justify-between bg-white px-4 py-3">
                            <button
                                className="font-bold-label arrow-group flex items-center gap-5 px-4 py-2"
                                onClick={() => {
                                    navigate("/");
                                }}
                            >
                                <div className="arrow-left-button"></div>
                                Back
                            </button>

                            <div className="flex gap-5">
                                <NavLabelButton
                                    title="Identifying Data"
                                    iconClass="identifying-button"
                                    sectionId="identifying-data"
                                    currentSection={currentSection}
                                    setCurrentSection={setCurrentSection}
                                />

                                <NavLabelButton
                                    title="Family Composition"
                                    iconClass="family-button"
                                    sectionId="family-composition"
                                    currentSection={currentSection}
                                    setCurrentSection={setCurrentSection}
                                />

                                <NavLabelButton
                                    title="Problems and Findings"
                                    iconClass="findings-button"
                                    sectionId="problems-findings"
                                    currentSection={currentSection}
                                    setCurrentSection={setCurrentSection}
                                />

                                {!creating && <NavLabelButton
                                    title="Interventions"
                                    iconClass="interventions-button"
                                    sectionId="interventions"
                                    currentSection={currentSection}
                                    setCurrentSection={setCurrentSection}
                                />}

                                <NavLabelButton
                                    title="Assessments"
                                    iconClass="assessment-button"
                                    sectionId="assessments"
                                    currentSection={currentSection}
                                    setCurrentSection={setCurrentSection}
                                />

                                <NavLabelButton
                                    title="Evaluation and Recommendation"
                                    iconClass="evaluations-button"
                                    sectionId="evaluation-recommendation"
                                    currentSection={currentSection}
                                    setCurrentSection={setCurrentSection}
                                />
                            </div>
                        </div>

                        <section className="flex flex-col gap-5" id="core-fields">
                            {!creating &&
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {data.is_active === true ? (
                                            <div className="font-bold-label rounded-full bg-[var(--color-green)] p-2 px-8 !text-white">
                                                Active
                                            </div>
                                        ) : (
                                            <div className="font-bold-label rounded-full bg-[var(--accent-dark)] p-2 px-8 !text-white">
                                                Inactive
                                            </div>
                                        )}

                                        {data.pendingTermination && (
                                            <div className="font-bold-label rounded-full bg-red-600 p-2 px-8 !text-white">
                                                Pending Termination
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="btn-blue font-bold-label drop-shadow-base"
                                        data-cy="download-case"
                                        onClick={() => generateCaseReport(clientId)}
                                    >
                                        Download
                                    </button>
                                </div>
                            }

                            {((editingField === "all" || editingField === "core-fields")) && (
                                <div className="flex items-center justify-between">
                                    <h1 className="header-main">Core Details</h1>
                                    {!creating && <button
                                        className={
                                            editingField === "core-fields"
                                                ? "icon-button-setup x-button"
                                                : "icon-button-setup dots-button"
                                        }
                                        onClick={() => {
                                            if (editingField) {
                                                resetFields();
                                            } else {
                                                setEditingField("core-fields");
                                            }
                                        }}
                                    ></button>}
                                </div>
                            )}

                            {(editingField === "all" || editingField === "core-fields") ? (
                                <>
                                    <div className="flex gap-5 w-full">
                                        <div className="flex flex-col gap-5 w-full">
                                            <label className="font-bold-label"><span className='text-red-500'>*</span> First Name</label>
                                            <input
                                                disabled={!creating}
                                                type="text"
                                                value={drafts.first_name}
                                                placeholder='First Name'
                                                onChange={(e) => setDrafts(prev => ({ ...prev, first_name: e.target.value }))}
                                                className="text-input font-label w-full"
                                                data-cy='fname'
                                            />
                                        </div>

                                        <div className="flex flex-col gap-5 w-full">
                                            <label className="font-bold-label">Middle Name</label>
                                            <input
                                                disabled={!creating}
                                                type="text"
                                                value={drafts.middle_name}
                                                placeholder='Middle Name'
                                                onChange={(e) => setDrafts(prev => ({ ...prev, middle_name: e.target.value }))}
                                                className="text-input font-label w-full"
                                                data-cy='mname'
                                            />
                                        </div>

                                        <div className="flex flex-col gap-5 w-full">
                                            <label className="font-bold-label"><span className='text-red-500'>*</span> Last Name</label>
                                            <input
                                                disabled={!creating}
                                                type="text"
                                                value={drafts.last_name}
                                                placeholder='Last Name'
                                                onChange={(e) => setDrafts(prev => ({ ...prev, last_name: e.target.value }))}
                                                className="text-input font-label w-full"
                                                data-cy='lname'
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-5 w-full">
                                        <label className="font-bold-label"><span className='text-red-500'>*</span> CH Number</label>
                                        <input
                                            disabled={!creating}
                                            type="text"
                                            value={drafts.sm_number}
                                            placeholder='CH Number'
                                            onChange={(e) => setDrafts(prev => ({ ...prev, sm_number: e.target.value }))}
                                            className="text-input font-label w-full max-w-[30rem]"
                                            data-cy='sm-number'
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h1 className="header-main">{`${data.first_name} ${data.middle_name} ${data.last_name}`}</h1>
                                        {data.is_active && !isTerminated && <button
                                            className={
                                                editingField === "core-fields"
                                                    ? "icon-button-setup x-button"
                                                    : "icon-button-setup dots-button"
                                            }
                                            onClick={() => {
                                                if (editingField) {
                                                    resetFields();
                                                } else {
                                                    setEditingField("core-fields");
                                                }
                                            }}
                                            data-cy='edit-core-details-section'
                                        ></button>}
                                    </div>
                                    <h2 className="header-sub">{data.sm_number}</h2>
                                </>
                            )}

                            <div className="flex flex-wrap justify-between gap-10">
                                {/* SPU Project */}
                                <div className="flex w-full flex-col md:w-[48%]">
                                    {(editingField === "all" || editingField === "core-fields") ? (
                                        <>
                                            <label className='font-bold-label'><span className='text-red-500'>*</span> SPU Project</label>
                                            <select
                                                className="text-input font-label"
                                                value={drafts.spu}
                                                disabled={!["head", "supervisor"].includes(user?.role)}
                                                onChange={(e) =>
                                                    setDrafts((prev) => ({
                                                        ...prev,
                                                        spu: e.target.value,
                                                    }))
                                                }
                                                data-cy='spu'
                                            >
                                                <option value="">Select SPU</option>
                                                {projectLocation.map((spu) => (
                                                    <option key={spu._id} value={spu._id}>
                                                        {spu.spu_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </>
                                    ) : (
                                        <p className="font-label">
                                            <span className="font-bold-label">
                                                SPU Project:
                                            </span>{" "}
                                            {projectLocation.find(
                                                (p) => p._id === data.spu,
                                            )?.spu_name || "-"}
                                        </p>
                                    )}
                                </div>

                                {/* Social Development Worker */}
                                <div className="flex w-full flex-col md:w-[48%]">
                                    {(editingField === "all" || editingField === "core-fields") ? (
                                        <>
                                            <label className='font-bold-label'><span className='text-red-500'>*</span> Social Development Worker</label>
                                            <select
                                                className="text-input font-label"
                                                disabled={!["head", "supervisor"].includes(user?.role)}
                                                value={drafts.assigned_sdw}
                                                onChange={(e) => {
                                                    setDrafts((prev) => ({
                                                        ...prev,
                                                        assigned_sdw: e.target.value,
                                                    }));
                                                }}
                                                data-cy="assigned-sdw"
                                            >
                                                <option value="">Select SDW</option>
                                                {socialDevelopmentWorkers
                                                    .filter((sdw) => {
                                                        const selectedSPUName = projectLocation.find(
                                                            (spu) => spu._id === drafts.spu
                                                        )?.spu_name;
                                                        return sdw.spu_id === selectedSPUName && sdw.role === "sdw";
                                                    })
                                                    .map((sdw) => (
                                                        <option key={sdw.id} value={sdw.id}>
                                                            {sdw.username}
                                                        </option>
                                                    ))}
                                            </select>


                                        </>
                                    ) : (
                                        <p className="font-label">
                                            <span className="font-bold-label">
                                                Social Development Worker:
                                            </span>{" "}
                                            {socialDevelopmentWorkers.find(
                                                (w) => w.id === data.assigned_sdw,
                                            )?.username || "-"}
                                        </p>

                                    )}
                                </div>
                            </div>

                            <div className='flex flex-col w-full'>
                                <label className="font-bold-label mb-2">
                                    {(editingField === "all" || editingField === "core-fields") && (
                                        <span className="text-red-500">* </span>
                                    )}
                                    Classification
                                    {!(editingField === "all" || editingField === "core-fields") && (
                                        <>: {data.classifications}</>
                                    )}
                                </label>
                                {(editingField === "all" || editingField === "core-fields") && (
                                    <>
                                        <div className="flex w-full max-w-[50rem] items-center self-start">
                                            <select
                                                className="text-input font-label"
                                                value={drafts.classifications}
                                                onChange={(e) =>
                                                    setDrafts((prev) => ({
                                                        ...prev,
                                                        classifications: e.target.value,
                                                    }))
                                                }
                                            >
                                                <option value="">
                                                    Select Classification
                                                </option>
                                                {classificationList.map((item) => (
                                                    <option key={item} value={item}>
                                                        {item}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>

                            {editingField === "core-fields" && (
                                <button
                                    className="btn-transparent-rounded my-3 ml-auto"
                                    onClick={async () => {
                                        if (forceSubmitAfterConfirm) {
                                            await handleSubmitCoreUpdate();
                                            setForceSubmitAfterConfirm(false);
                                            return;
                                        }

                                        const valid = await checkCore();
                                        if (!valid) return;


                                        if (valid === "pending-super-confirm") {
                                            setModalTitle("SDW Outside Supervision");
                                            setModalBody("You are about to assign the case to an SDW that is not under your supervision. You will no longer be able to modify the case. Are you sure you want to proceed?");
                                            setModalImageCenter(<div className="warning-icon mx-auto" />);
                                            setModalConfirm(true);

                                            setModalOnConfirm(() => async () => {
                                                setForceSubmitAfterConfirm(true);
                                                setShowModal(false);
                                                await handleSubmitCoreUpdate();
                                            });

                                            setModalOnClose(() => () => {
                                                setForceSubmitAfterConfirm(false);
                                            });

                                            setShowModal(true);
                                            return;
                                        }

                                        await handleSubmitCoreUpdate();
                                    }}
                                    data-cy="submit-core-details-section"
                                >
                                    Submit Changes
                                </button>
                            )}


                        </section>

                        <section className='flex flex-col gap-8' id="identifying-data" ref={ref1}>
                            <div className="flex justify-between items-center">
                                <h1 className="header-main">Identifying Data</h1>
                                {user?.role == "sdw" && !creating && data.is_active && !isTerminated && <button
                                    className={
                                        editingField === "identifying-fields"
                                            ? "icon-button-setup x-button"
                                            : "icon-button-setup dots-button"
                                    }
                                    onClick={() => {
                                        if (editingField) {
                                            resetFields();
                                        } else {
                                            setEditingField("identifying-fields");
                                        }
                                    }}
                                    data-cy='edit-identifying-data-section'
                                ></button>}
                            </div>

                            {(editingField === "all" || editingField === "identifying-fields") ? (
                                <>
                                    <div className="flex justify-between gap-20">
                                        <div className="flex w-full flex-col gap-5">
                                            <label className="font-bold-label" htmlFor="age">Age</label>
                                            <input
                                                type="number"
                                                id="age"
                                                value={age}
                                                readOnly
                                                disabled
                                                className="text-input font-label"
                                                data-cy='age'
                                            />
                                        </div>

                                        <div className="flex flex-col gap-5 w-full">
                                            <label className="font-bold-label"><span className='text-red-500'>*</span> Date of Birth</label>
                                            <input
                                                disabled={!creating}
                                                type="date"
                                                value={drafts.dob || ""}
                                                onChange={(e) => setDrafts(prev => ({ ...prev, dob: e.target.value }))}
                                                className="text-input font-label"
                                                data-cy='dob'
                                            />
                                        </div>

                                        <div className='flex flex-col gap-5 w-full'>
                                            <label className="font-bold-label"><span className='text-red-500'>*</span> Sex</label>
                                            <select
                                                disabled={!creating}
                                                className='text-input font-label'
                                                value={drafts.sex || ""}
                                                onChange={(e) => setDrafts(prev => ({ ...prev, sex: e.target.value }))}
                                                data-cy='sex'
                                            >
                                                <option value="">Select Sex</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>

                                        <div className="flex w-full flex-col gap-5">
                                            <label className="font-bold-label">Contact No.</label>
                                            <input
                                                type="text"
                                                className="text-input font-label"
                                                placeholder="Contact No."
                                                value={drafts.contact_no || ""}
                                                onChange={(e) => setDrafts(prev => ({ ...prev, contact_no: e.target.value }))}
                                                data-cy='contact-num'
                                            />
                                        </div>
                                    </div>

                                    <div className='flex justify-between gap-20'>
                                        <div className="flex flex-col gap-5 w-full">
                                            <label className="font-bold-label">Educational Attainment</label>
                                            <input
                                                type="text"
                                                placeholder='Educational Attainment'
                                                value={drafts.edu_attainment || ""}
                                                onChange={(e) => setDrafts(prev => ({ ...prev, edu_attainment: e.target.value }))}
                                                data-cy='educational-attainment'
                                                className="text-input font-label"
                                            />
                                        </div>

                                        <div className='flex flex-col gap-5 w-full'>
                                            <label className="font-bold-label">Occupation</label>
                                            <input
                                                type="text"
                                                value={drafts.occupation || ""}
                                                placeholder='Occupation'
                                                onChange={(e) => setDrafts(prev => ({ ...prev, occupation: e.target.value }))}
                                                className='text-input font-label'
                                                data-cy='occupation'
                                            />
                                        </div>

                                        <div className="flex flex-col gap-5 w-full">
                                            <label className="font-bold-label"><span className='text-red-500'>*</span> Civil Status</label>
                                            <select
                                                className="text-input font-label"
                                                value={drafts.civil_status || ""}
                                                onChange={(e) => setDrafts(prev => ({ ...prev, civil_status: e.target.value }))}
                                                data-cy='civil-status'
                                            >
                                                <option value="">Select Civil Status</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                                <option value="Divorced">Divorced</option>
                                                <option value="Separated">Separated</option>
                                                <option value="Widowed">Widowed</option>
                                            </select>
                                        </div>

                                        <div className='flex flex-col gap-5 w-full'>
                                            <label className="font-bold-label">Religion</label>
                                            <input
                                                type="text"
                                                value={drafts.religion || ""}
                                                placeholder='Religion'
                                                onChange={(e) => setDrafts(prev => ({ ...prev, religion: e.target.value }))}
                                                className='text-input font-label'
                                                data-cy='religion'
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between gap-20">
                                        {/* <div className="flex w-full flex-col gap-5">
                                    <label className="font-bold-label">Relationship to Client</label>
                                    <input
                                        type="text"
                                        className="text-input font-label"
                                        placeholder="Relationship to Client"
                                        value={drafts.relationship_to_client || ""}
                                        onChange={(e) => setDrafts(prev => ({ ...prev, relationship_to_client: e.target.value }))}
                                        data-cy='relationship'
                                    />
                                </div> */}

                                        <div className="flex w-full flex-col gap-5">
                                            <label className="font-bold-label"><span className='text-red-500'>*</span> Present Address</label>
                                            <textarea
                                                className="text-input font-label resize-y min-h-[20rem]"
                                                placeholder="Present Address"
                                                value={drafts.present_address || ""}
                                                onChange={(e) => setDrafts(prev => ({ ...prev, present_address: e.target.value }))}
                                                data-cy='address'
                                            ></textarea>
                                        </div>

                                        <div className='flex flex-col gap-5 w-full'>
                                            <label className="font-bold-label">{<span className='text-red-500'>* </span>}Place of Birth</label>
                                            <input
                                                disabled={!creating}
                                                type="text"
                                                value={drafts.pob || ""}
                                                placeholder='Place of Birth'
                                                onChange={(e) => setDrafts(prev => ({ ...prev, pob: e.target.value }))}
                                                className='text-input font-label'
                                                data-cy='pob'
                                            />
                                        </div>
                                    </div>

                                    {!creating && <div className="flex justify-end">
                                        <button
                                            className="btn-transparent-rounded my-3 ml-auto"
                                            onClick={async () => {
                                                const valid = checkIdentifying();
                                                if (!valid) return;

                                                try {
                                                    const updated = await updateIdentifyingCaseData(drafts, clientId);

                                                    setData((prev) => ({
                                                        ...prev,
                                                        dob: updated.dob || drafts.dob,
                                                        civil_status: updated.civil_status || drafts.civil_status,
                                                        edu_attainment: updated.edu_attainment || drafts.edu_attainment,
                                                        sex: updated.sex || drafts.sex,
                                                        pob: updated.pob || drafts.pob,
                                                        religion: updated.religion || drafts.religion,
                                                        occupation: updated.occupation || drafts.occupation,
                                                        present_address: updated.present_address || drafts.present_address,
                                                        contact_no: updated.contact_no || drafts.contact_no,
                                                    }));

                                                    setEditingField(null);
                                                    showSuccess("Identifying data was successfully updated!");
                                                } catch (error) {
                                                    setModalTitle("Update Error");
                                                    setModalBody(error.message || "An unexpected error occurred.");
                                                    setModalImageCenter(<div className="warning-icon mx-auto"></div>);
                                                    setModalConfirm(false);
                                                    setShowModal(true);
                                                }
                                            }}
                                            data-cy="submit-identifying-data-section"
                                        >
                                            Submit Changes
                                        </button>
                                    </div>}
                                </>
                            ) : (
                                <div className="font-label grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
                                    <p><span className="font-bold-label">Age:</span> {age == 0 ? 0 : age || "-"}</p>
                                    <p><span className="font-bold-label">Date of Birth:</span> {data.dob || "-"}</p>
                                    <p><span className="font-bold-label">Sex:</span> {data.sex || "-"}</p>
                                    <p><span className="font-bold-label">Contact No.:</span> {data.contact_no || "-"}</p>
                                    <p><span className="font-bold-label">Educational Attainment:</span> {data.edu_attainment || "-"}</p>
                                    <p><span className="font-bold-label">Occupation:</span> {data.occupation || "-"}</p>
                                    <p><span className="font-bold-label">Civil Status:</span> {data.civil_status || "-"}</p>
                                    <p><span className="font-bold-label">Religion:</span> {data.religion || "-"}</p>
                                    {/* <p><span className="font-bold-label">Relationship to Client:</span> {data.relationship_to_client || "-"}</p> */}
                                    <p><span className="font-bold-label">Present Address:</span> {data.present_address || "-"}</p>
                                    <p><span className="font-bold-label">Place of Birth:</span> {data.pob || "-"}</p>
                                </div>
                            )}
                        </section>

                        <section
                            className="flex flex-col gap-8"
                            id="family-composition"
                            ref={ref2}
                        >
                            <h1 className="header-main">Family Composition</h1>

                            {creating && <p className="font-label">Family Composition can be filled out on created cases.</p>}

                            {!creating && <>
                                {data.is_active && user?.role == "sdw" && !isTerminated && <button
                                    className="btn-primary font-bold-label drop-shadow-base"
                                    onClick={handleAddFamilyMember}
                                    data-cy='add-family-member'
                                >
                                    Add New Family Member
                                </button>}

                                <div className="flex justify-between gap-10">
                                    {familyMembers.length === 0 ? (
                                        <div className="w-full text-center font-bold-label p-6 border rounded-lg">
                                            No family members found
                                        </div>
                                    ) : (
                                        <div
                                            className="outline-gray flex w-full gap-8 overflow-x-auto rounded-lg p-6"
                                        >
                                            {familyMembers.map((member, index) => (
                                                <FamilyCard
                                                    key={index}
                                                    clientId={clientId}
                                                    index={index}
                                                    member={member}
                                                    selectedFamily={selectedFamily}
                                                    setSelectedFamily={setSelectedFamily}
                                                    editingFamilyValue={editingFamilyValue}
                                                    setEditingFamilyValue={setEditingFamilyValue}
                                                    familyMembers={familyMembers}
                                                    setFamilyMembers={setFamilyMembers}
                                                    handleDeleteFamilyMember={handleDeleteFamilyMember}
                                                    setShowModal={setShowModal}
                                                    setModalTitle={setModalTitle}
                                                    setModalBody={setModalBody}
                                                    setModalImageCenter={setModalImageCenter}
                                                    setModalConfirm={setModalConfirm}
                                                    setModalOnConfirm={setModalOnConfirm}
                                                    editable={user?.role}
                                                    terminated={isTerminated}
                                                    activeMember={data.is_active}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </>}
                        </section>

                        <section
                            className="flex flex-col gap-8"
                            id="problems-findings"
                            ref={ref3}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <h1 className="header-main">Problems and Findings</h1>
                                {/* {user?.role == "sdw" && !creating && <button
                            className={
                                editingField === "history-fields"
                                    ? "icon-button-setup x-button"
                                    : "icon-button-setup dots-button"
                            }
                            onClick={() => {
                                if (editingField) {
                                    resetFields();
                                } else {
                                    setEditingField("history-fields");
                                }
                            }}
                            data-cy="edit-problems-findings-section"
                        ></button>} */}
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="flex flex-col gap-4">
                                    <h3 className="header-sub">{creating && <span className='text-red-500'>* </span>}Problem Presented</h3>

                                    {(editingField === "all" || editingField === "history-fields") ? (
                                        <textarea
                                            className="text-input font-label resize-y min-h-[20rem]"
                                            value={drafts.problem_presented}
                                            placeholder="Problem Presented"
                                            onChange={(e) =>
                                                setDrafts((prev) => ({
                                                    ...prev,
                                                    problem_presented: e.target.value,
                                                }))
                                            }
                                            data-cy="problem"
                                        />
                                    ) : (
                                        <p className="font-label" data-cy="disp-problem">
                                            {data.problem_presented || "-"}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="header-sub">{creating && <span className='text-red-500'>* </span>}History of the Problem</h3>

                                    {(editingField === "all" || editingField === "history-fields") ? (
                                        <textarea
                                            className="text-input font-label resize-y min-h-[20rem]"
                                            placeholder="History of the Problem"
                                            value={drafts.history_problem}
                                            onChange={(e) =>
                                                setDrafts((prev) => ({
                                                    ...prev,
                                                    history_problem: e.target.value,
                                                }))
                                            }
                                            data-cy="problem-history"
                                        />
                                    ) : (
                                        <p className="font-label" data-cy="disp-problem-history">
                                            {data.history_problem || "-"}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="header-sub">{creating && <span className='text-red-500'>* </span>}Findings</h3>

                                    {(editingField === "all" || editingField === "history-fields") ? (
                                        <textarea
                                            className="text-input font-label resize-y min-h-[20rem]"
                                            placeholder="Findings"
                                            value={drafts.observation_findings}
                                            onChange={(e) =>
                                                setDrafts((prev) => ({
                                                    ...prev,
                                                    observation_findings: e.target.value,
                                                }))
                                            }
                                            data-cy="finding"
                                        />
                                    ) : (
                                        <p className="font-label" data-cy="disp-finding">
                                            {data.observation_findings || "-"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {editingField === "history-fields" && (
                                <button
                                    className="btn-transparent-rounded my-3 ml-auto"
                                    onClick={async () => {
                                        try {
                                            const updated = await editProblemsFindings(clientId, {
                                                problem_presented: drafts.problem_presented,
                                                history_problem: drafts.history_problem,
                                                observation_findings: drafts.observation_findings,
                                            });

                                            setData((prev) => ({
                                                ...prev,
                                                problem_presented: updated.problemPresented || drafts.problem_presented,
                                                history_problem: updated.historyProblem || drafts.history_problem,
                                                observation_findings: updated.observationFindings || drafts.observation_findings,
                                            }));

                                            setEditingField(null);
                                            showSuccess("Problems and Findings were successfully updated!");
                                        } catch (error) {
                                            console.error("❌ Update failed:", error);
                                            setModalTitle("Update Error");
                                            setModalBody(error.message || "An unexpected error occurred.");
                                            setModalImageCenter(<div className="warning-icon mx-auto"></div>);
                                            setModalConfirm(false);
                                            setShowModal(true);
                                        }
                                    }}
                                    data-cy="submit-problems-findings-section"
                                >
                                    Submit Changes
                                </button>

                            )}
                        </section>

                        {!creating && <section
                            className="flex flex-col gap-8"
                            id="interventions"
                            ref={ref4}
                        >
                            <h1 className="header-main">Interventions</h1>
                            <div className="flex justify-between">
                                <select
                                    name="services"
                                    id="services"
                                    value={intervention_selected}
                                    onChange={(e) =>
                                        setInterventionSelected(e.target.value)
                                    }
                                    className="label-base text-input max-w-96"
                                    data-cy='intervention-type'
                                >
                                    <option value="" className="body-base">
                                        Select Intervention
                                    </option>
                                    {Object.entries(interventions).map(
                                        ([key, value], index) => (
                                            <option
                                                key={index}
                                                value={key}
                                                className="body-base"
                                            >
                                                {key}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                            <div className="flex w-full flex-col">
                                <div className="flex w-full flex-col gap-40 border-b border-[var(--border-color)]">
                                    <div className="flex justify-between px-2.5">
                                        <p className="label-base w-80">Intervention</p>
                                        <p className="label-base w-80">Date</p>
                                    </div>
                                </div>
                                <div className="flex w-full flex-col flex-wrap gap-2.5">
                                    {intervention_selected == "" && <p className="body-base self-center mt-8">No Intervention Type Selected</p>}
                                    {interventions[intervention_selected]?.length > 0 ? (
                                        interventions[intervention_selected]?.map(
                                            (item, index) => (
                                                <a
                                                    key={index}
                                                    href={`/${item.route}/?action=view&caseID=${clientId}&formID=${item.formID}`}
                                                    // onClick={() =>
                                                    //     handleInterventionNavigation(
                                                    //         item.route,
                                                    //         clientId,
                                                    //         item.formID,
                                                    //     )
                                                    // }
                                                    className="flex h-16 items-center justify-between rounded-lg p-2.5 text-left hover:bg-[var(--bg-color-dark)]"
                                                    data-cy={`intervention-item-${item.intervention}-${index}`}
                                                >
                                                    <p className="label-base w-80">
                                                        {item.intervention} {index + 1}
                                                    </p>
                                                    <p className="label-base w-80">
                                                        {item.date}
                                                    </p>
                                                </a>
                                            ),
                                        )
                                    ) : intervention_selected && (
                                        <p className="body-base self-center mt-8">No Interventions Available</p>
                                    )
                                    }

                                    {user?.role == "sdw" && !isTerminated && <button
                                        name="add_intervention"
                                        id="add_intervention"
                                        onClick={() =>
                                            handleNewIntervention(
                                                clientId
                                            )
                                        }
                                        className="btn-primary font-bold-label self-center mt-10"
                                        data-cy='add-intervention'
                                    >
                                        New Intervention
                                    </button>
                                    }
                                </div>
                            </div>
                        </section>}

                        {!creating && <section
                            className="flex flex-col gap-8"
                            id="interventions"
                            ref={ref4}
                        >
                            <div className="flex justify-between">
                                <h1 className="header-main">Progress Reports</h1>
                            </div>
                            <div className="flex w-full flex-col">
                                <div className="flex w-full flex-col gap-40 border-b border-[var(--border-color)]">
                                    <div className="flex justify-between px-2.5">
                                        <p className="label-base w-80">
                                            Progress Report
                                        </p>
                                        <p className="label-base w-80">Date</p>
                                    </div>
                                </div>
                                <div className="flex w-full flex-col flex-wrap gap-2.5">
                                    {progress_reports?.length > 0 ? (
                                        progress_reports?.map((item, index) => (
                                            <a
                                                key={index}
                                                href={`/progress-report/?action=view&caseID=${clientId}&formID=${item.formID}`}
                                                // onClick={(e) => {
                                                //     e.preventDefault();
                                                //     handleProgressReportNavigation(clientId, item.formID);
                                                // }}
                                                className="flex h-16 items-center justify-between rounded-lg p-2.5 text-left hover:bg-[var(--bg-color-dark)]"
                                                data-cy={`progress-report-item-${item.name}-${index}`}
                                            >
                                                <p className="label-base w-80" data-cy={`disp-progress-report-item-${item.name}-${index}`}>
                                                    {item.name} {index + 1}
                                                </p>
                                                <p className="label-base w-80">
                                                    {item.date}
                                                </p>
                                            </a>
                                        ))
                                    ) : (
                                        <p className="body-base self-center mt-8">No Progress Reports Available</p>
                                    )}

                                    {user?.role == "sdw" && !isTerminated && <button
                                        name="add_progress_report"
                                        id="add_progress_report"
                                        onClick={() =>
                                            handleNewProgressReport(
                                                clientId
                                            )
                                        }
                                        className="btn-primary font-bold-label self-center mt-10"
                                        data-cy='add-progress-report'
                                    >
                                        New Progress Report
                                    </button>
                                    }
                                </div>
                            </div>
                        </section>}

                        <section
                            className="flex flex-col gap-8"
                            id="assessments"
                            ref={ref5}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <h1 className="header-main">{creating && <span className='text-red-500'>* </span>}Assessment</h1>
                                {/* {user?.role == "sdw" && !creating && <button
                            className={
                                editingField === "assessment-field"
                                    ? "icon-button-setup x-button"
                                    : "icon-button-setup dots-button"
                            }
                            onClick={() => {
                                if (editingField) {
                                    resetFields();
                                } else {
                                    setEditingField("assessment-field");
                                }
                            }}
                            data-cy="assessment-section"
                        ></button>} */}
                            </div>

                            <div className="grid grid-cols-1 gap-10">
                                <div className="flex flex-col gap-4">
                                    {(editingField === "all" || editingField === "assessment-field") ? (
                                        <textarea
                                            className="text-input font-label resize-y min-h-[20rem]"
                                            value={drafts.assessment || ""}
                                            placeholder="Assessment"
                                            onChange={(e) =>
                                                setDrafts((prev) => ({
                                                    ...prev,
                                                    assessment: e.target.value,
                                                }))
                                            }
                                            data-cy="assessment"
                                        />
                                    ) : (
                                        <p className="font-label" data-cy="disp-assessment">
                                            {data.assessment || "-"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {editingField === "assessment-field" && (
                                <button
                                    className="btn-transparent-rounded my-3 ml-auto"
                                    onClick={async () => {
                                        try {
                                            const updated = await editAssessment(clientId, {
                                                assessment: drafts.assessment,
                                            });

                                            setData((prev) => ({
                                                ...prev,
                                                assessment: updated.assessment || drafts.assessment,
                                            }));

                                            setEditingField(null);
                                            showSuccess("Assessment was successfully updated!");
                                        } catch (error) {
                                            console.error("❌ Update failed:", error);
                                            setModalTitle("Update Error");
                                            setModalBody(error.message || "An unexpected error occurred.");
                                            setModalImageCenter(<div className="warning-icon mx-auto"></div>);
                                            setModalConfirm(false);
                                            setShowModal(true);
                                        }
                                    }}
                                    data-cy="submit-assessment-section"
                                >
                                    Submit Changes
                                </button>
                            )}
                        </section>

                        <section
                            className="flex flex-col gap-8"
                            id="evaluation-recommendation"
                            ref={ref6}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <h1 className="header-main">
                                    Evaluation and Recommendation
                                </h1>
                                {/* {!creating && user?.role == "sdw" && <button
                            className={
                                editingField === "evaluation-fields"
                                    ? "icon-button-setup x-button"
                                    : "icon-button-setup dots-button"
                            }
                            onClick={() => {
                                if (editingField) {
                                    resetFields();
                                } else {
                                    setEditingField("evaluation-fields");
                                }
                            }}
                            data-cy="edit-evaluation-recommendation-section"
                        ></button>} */}
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="flex flex-col gap-4">
                                    <h3 className="header-sub">{creating && <span className='text-red-500'>* </span>}Evaluation</h3>

                                    {(editingField === "all" || editingField === "evaluation-fields") ? (
                                        <textarea
                                            className="text-input font-label resize-y min-h-[20rem]"
                                            value={drafts.evaluation}
                                            placeholder="Evaluation"
                                            onChange={(e) =>
                                                setDrafts((prev) => ({
                                                    ...prev,
                                                    evaluation: e.target.value,
                                                }))
                                            }
                                            data-cy="evaluation"
                                        />
                                    ) : (
                                        <p className="font-label" data-cy="disp-evaluation">
                                            {data.evaluation || "-"}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h3 className="header-sub">{creating && <span className='text-red-500'>* </span>}Recommendation</h3>

                                    {(editingField === "all" || editingField === "evaluation-fields") ? (
                                        <textarea
                                            className="text-input font-label resize-y min-h-[20rem]"
                                            value={drafts.recommendation}
                                            placeholder="Recommendation"
                                            onChange={(e) =>
                                                setDrafts((prev) => ({
                                                    ...prev,
                                                    recommendation: e.target.value,
                                                }))
                                            }
                                            data-cy="recommendation"
                                        />
                                    ) : (
                                        <p className="font-label" data-cy="disp-recommendation">
                                            {data.recommendation || "-"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {editingField === "evaluation-fields" && (
                                <button
                                    className="btn-transparent-rounded my-3 ml-auto"
                                    onClick={async () => {
                                        try {
                                            const updated = await editEvalReco(clientId, {
                                                evaluation: drafts.evaluation,
                                                recommendation: drafts.recommendation,
                                            });

                                            setData((prev) => ({
                                                ...prev,
                                                evaluation: drafts.evaluation,
                                                recommendation: drafts.recommendation,
                                            }));
                                            setEditingField(null);
                                            showSuccess("Evaluation and Recommendation were successfully updated.");
                                        } catch (error) {
                                            console.error("❌ Update failed:", error);
                                            setModalTitle("Update Error");
                                            setModalBody(error.message || "An unexpected error occurred.");
                                            setModalImageCenter(<div className="warning-icon mx-auto"></div>);
                                            setModalConfirm(false);
                                            setShowModal(true);
                                        }
                                    }}
                                    data-cy="submit-evaluation-recommendation-section"
                                >
                                    Submit Changes
                                </button>


                            )}
                        </section>

                        {creating && <button className="btn-blue header-sub drop-shadow-base my-3 mb-20 mx-auto"
                            onClick={submitNewCase}
                            data-cy='create-case'
                            disabled={modalConfirm}>
                            Create Case
                        </button>}

                        {!creating && (
                            caseClosureForm ? (
                                <button
                                    onClick={() =>
                                        handleViewCaseTermination(
                                            clientId
                                        )
                                    }
                                    className="btn-primary font-bold-label drop-shadow-base my-3 ml-auto"
                                    data-cy='terminate-case'>
                                    View Termination Form
                                </button>
                            ) : (
                                user?.role === "sdw" ? (
                                    <button
                                        onClick={() =>
                                            handleCaseTermination(
                                                clientId
                                            )}
                                        className="btn-primary font-bold-label drop-shadow-base my-3 ml-auto"
                                        data-cy='terminate-case'>
                                        Terminate Case
                                    </button>
                                ) : null
                            )
                        )
                        }

                        {!data.is_active && <div className="mb-[5rem]"></div>}
                    </main>
                </>)}
        </>
    );
}

export default CaseFrontend;
