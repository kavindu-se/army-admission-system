import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import {
  API_BASE,
  createOrUpdateApplication,
  getApplication,
  getAttachments,
  getSchools,
  uploadAttachment
} from "../api.js";

const initialFormA = {
  applicant_full_name_caps: "",
  applicant_name_initials: "",
  applicant_nic: "",
  applicant_dob: "",
  regiment_name: "",
  unit_name: "",
  service_number: "",
  previous_service_number: "",
  rank_designation: "",
  applicant_religion: "",
  applicant_religion_other: "",
  date_of_enlistment: "",
  present_workplace: "",
  permanent_address: "",
  contact_number: "",
  child_full_name_caps: "",
  child_name_initials: "",
  child_dob: "",
  child_age_years: "",
  child_age_months: "",
  child_age_days: "",
  child_gender: "",
  child_religion: "",
  child_religion_other: "",
  medium_of_instruction: "",
  present_school: "",
  child_address: "",
  child_gn_division: "",
  child_district: "",
  child_province: "",
  service_status: "",
  is_twin: "",
  has_special_needs: "",
  special_talents: "",
  other_parent_service_no: "",
  other_parent_rank: "",
  other_parent_unit: "",
  other_parent_name_initials: "",
  other_parent_enlistment_date: "",
  other_parent_nic: "",
  casualty_date: "",
  casualty_place: "",
  disability_date: "",
  disability_place: "",
  disability_percentage: "",
  disability_on_active_service: "",
  disability_nature: "",
  disability_retired_date: "",
  applicant_declaration_confirmed: false,
  decorations: [
    { name: "Param Weera Vibhushanaya (PWV)", times: "", order_no: "" },
    { name: "Weerodara Vibhushanaya (WV)", times: "", order_no: "" },
    { name: "Weera Wickrama Vibhushanaya (WWV)", times: "", order_no: "" },
    { name: "Rana Wickrama Medal (RWM)", times: "", order_no: "" },
    { name: "Rana Sura Medal (RSM)", times: "", order_no: "" },
    { name: "Vishista Seva Vibhushanaya (VSV)", times: "", order_no: "" },
    {
      name: "Uttama Seva Padakkama / Karyakshama Seva Vibhushanaya",
      times: "",
      order_no: ""
    },
    { name: "Deshaputra Sammanaya", times: "", order_no: "" }
  ],
  sports_achievements: "",
  schools: Array.from({ length: 10 }, (_, idx) => ({
    priority: String(idx + 1).padStart(2, "0"),
    census_no: "",
    name: ""
  }))
};

const initialFormB = {
  notes: ""
};

const STRINGS = {
  en: {
    title: "Grade 1 Admission Application",
    application_notice:
      "All applicants must submit their applications under the residential basis / past pupil basis / sibling basis. However, there are instances where, after such submission, principals refuse even to subject applicants to interviews and instead instruct them to submit applications through military channels. In such situations, the matter should be reported in writing to the Welfare Directorate immediately.",
    applicant_note:
      "A father or mother who served in active operational duty for a longer period of time.",
    applicant_section: "01. Particulars of the Applicant (Service Person / Guardian)",
    full_name_caps: "Full Name (IN CAPITAL LETTERS)",
    name_initials: "Name with Initials",
    nic: "National Identity Card (NIC) No",
    dob: "Date of Birth",
    unit: "Unit",
    regiment: "Regiment",
    service_no: "Service Number / Force Number",
    prev_service_no: "Previous Service Number (if any)",
    rank: "Rank / Designation",
    enlistment_date: "Date of Enlistment / Appointment",
    present_workplace: "Present Place of Work / Service Station",
    permanent_address: "Permanent Address",
    contact_number: "Contact Number",
    applicant_religion: "Applicant Religion",
    child_section: "02. Particulars of the Child",
    child_note:
      "A certified photocopy of the birth certificate should be attached.",
    birth_upload_label: "Birth Certificate (PDF/JPG/PNG)",
    upload_button: "Upload",
    upload_success: "Birth certificate uploaded.",
    upload_error: "Upload failed.",
    uploaded_attachments: "Uploaded attachments",
    no_attachments: "No attachments uploaded.",
    child_full_name_caps: "Full Name of the Child (IN CAPITAL LETTERS)",
    child_name_initials: "Name with Initials",
    child_dob: "Date of Birth",
    child_age_years: "Age (Years)",
    child_age_months: "Age (Months)",
    child_age_days: "Age (Days)",
    gender: "Gender",
    religion: "Religion",
    medium: "Medium of Instruction",
    present_school: "Present School (if any)",
    child_address: "Address",
    gn_division: "Grama Niladhari Division",
    district: "District",
    province: "Province",
    service_status_section: "03. Service Status of the Applicant",
    special_info_section: "04. Special Information",
    is_twin: "Is the child a twin?",
    special_needs: "Special educational needs?",
    sports_talents: "Sports / Special Talents (if any)",
    schools_section: "05. Schools Applied For (In Order of Priority)",
    search: "Search",
    search_placeholder: "Search by census number or school name",
    select_school: "Select school",
    add: "Add",
    selected_schools: "Selected Schools (Priority Order)",
    not_selected: "Not selected",
    remove: "Remove",
    both_parents_section:
      "06. If both parents are serving in the Armed Forces, provide details of the other service person",
    service_number_simple: "Service Number",
    unit_regiment: "Unit / Regiment",
    other_parent_name_initials: "Name with Initials",
    other_parent_enlistment_date: "Date of Enlistment",
    other_parent_nic: "National Identity Card (NIC) No.",
    note_service_certificate:
      "Note: A service certificate issued by the relevant Commanding / Authorizing Officer must be attached. If such certification is not submitted, marks/priority for this category will not be considered.",
    casualty_section:
      "07. If the Father or Mother was Killed, Missing or Disabled while on Active Service, provide details",
    casualty_date: "Date of Death / Missing",
    casualty_place: "Place of Death / Missing",
    disability_date: "Disability Date",
    disability_place: "Disability Place",
    disability_percentage: "Percentage of Disability",
    disability_on_active:
      "Whether the disability occurred while on active service",
    disability_nature: "Nature / Type of Disability",
    note_disability:
      "Note: attach copy of the medical report obtained after 01 January of the year preceding the year of admission must be certified by the Army Hospital, Colombo, and submitted.",
    disability_retired_date: "If retired due to disability, date of retirement",
    medals_section:
      "08. Details of Decorations / Medals Awarded to the Service Member",
    medal_pwv: "Param Weera Vibhushanaya (PWV)",
    medal_wv: "Weerodara Vibhushanaya (WV)",
    medal_wwv: "Weera Wickrama Vibhushanaya (WWV)",
    medal_rwm: "Rana Wickrama Medal (RWM)",
    medal_rsm: "Rana Sura Medal (RSM)",
    medal_vsv: "Vishista Seva Vibhushanaya (VSV)",
    medal_uttama: "Uttama Seva Padakkama / Karyakshama Seva Vibhushanaya",
    medal_deshaputra: "Deshaputra Sammanaya",
    sports_section: "09. Sports Achievements",
    details: "Details",
    note_sports:
      "Note: Certified copies of relevant sports certificates issued or endorsed by the authorized officer / sports authority must be attached.",
    save_draft: "Save Draft",
    submit_application: "Submit Application",
    select_unit: "Select unit",
    specify_religion: "Specify religion",
    yes: "Yes",
    no: "No",
    male: "Male",
    female: "Female",
    buddhist: "Buddhist",
    hindu: "Hindu",
    islam: "Islam",
    christian: "Christian",
    other: "Other",
    sinhala: "Sinhala",
    tamil: "Tamil",
    english: "English",
    status_current: "Currently in active service",
    status_disabled: "Disabled while on active duty",
    status_deceased: "Deceased while on active duty",
    status_retired: "Retired from service",
    declaration_section: "10. Applicant Declaration",
    declaration_text:
      "I hereby certify that my child is not currently receiving education at any government, private, or recognized school, and has not received such education previously. I further certify that the information stated above by me is true, and I am aware that if any information provided in this application is proven to be false for any reason, this application will be rendered null and void.\n\nFurthermore, I agree that if, even after admission to the school, any information stated in this application is proven to be false, my child will be removed from the said school and admitted to another school nominated by the Ministry of Education without any objection on my part.\n\nI also certify that, regardless of which school is granted from among the schools mentioned in the applications submitted by me, I will admit my child to that school, and that I have submitted an application under the normal admission procedure based on my permanent residence for the purpose of school admission.",
    declaration_agree: "I confirm and agree to the declaration above.",
    declaration_required: "Please confirm the declaration before submitting."
  },
  si: {
    title: "1 ශ්‍රේණි ප්‍රවේශ අයදුම්පත",
    application_notice:
      "සියලුම අයදුම්කරුවන් ගෘහ මූලික පදනම / ආධි ශිෂ්‍ය පදනම / සහෝදර පදනම මත අයදුම්පත් ඉදිරිපත් කළ යුතු අතර, එසේ ඉදිරිපත් කළ පසු විදුහල්පතිවරුන් විසින් හමුදා ක්‍රමය මගින් ඉල්ලුම්පත් ඉදිරිපත් කරන ලෙස දන්වා සම්මුඛ පරීක්ෂණයට භාජනය කිරීම පවා ප්‍රතික්ෂේප කරන අවස්ථා ඇති බැවින්, එසේ වූහොත් ඒ බව සුබසාධක අධ්‍යක්ෂ මණ්ඩලයට ලිඛිතව එම අවස්ථාවේදීම දැනුම් දීමට කටයුතු කළ යුතුය.",
    applicant_section: "01. අයදුම්කරුගේ (සේවා පුද්ගලයා / භාරකරු) විස්තර",
    full_name_caps: "සම්පූර්ණ නම (ලොකු අකුරින්)",
    name_initials: "මුල් අකුරු සමඟ නම",
    nic: "ජාතික හැඳුනුම්පත් අංකය",
    dob: "උපන් දිනය",
    unit: "ඒකකය",
    regiment: "පෙළ/රෙජිමන්ට්",
    service_no: "සේවා අංකය / බලකා අංකය",
    prev_service_no: "පෙර සේවා අංකය (තිබේ නම්)",
    rank: "පදවිය / තනතුර",
    enlistment_date: "සේවයට බැඳුනු දිනය / පත්වීම් දිනය",
    present_workplace: "දැනට සේවය කරන ස්ථානය / සේවා ස්ථානය",
    permanent_address: "ස්ථිර ලිපිනය",
    contact_number: "දුරකථන අංකය",
    applicant_religion: "අයදුම්කරුගේ ආගම",
    child_section: "02. දරුවාගේ විස්තර",
    child_note: "උප්පැන්න සහතිකයේ සහතික කරන ලද ඡායා පිටපතක් අමුණිය යුතුය.",
    birth_upload_label: "උප්පැන්න සහතිකය (PDF/JPG/PNG)",
    upload_button: "උඩුගත කරන්න",
    upload_success: "උප්පැන්න සහතිකය උඩුගත විය.",
    upload_error: "උඩුගත කිරීම අසාර්ථක විය.",
    uploaded_attachments: "Uploaded attachments",
    no_attachments: "No attachments uploaded.",
    child_full_name_caps: "දරුවාගේ සම්පූර්ණ නම (ලොකු අකුරින්)",
    child_name_initials: "මුල් අකුරු සමඟ නම",
    child_dob: "උපන් දිනය",
    child_age_years: "වයස (අවුරුදු)",
    child_age_months: "වයස (මාස)",
    child_age_days: "වයස (දින)",
    gender: "ස්ත්‍රී / පුරුෂ භාවය",
    religion: "ආගම",
    medium: "උපදේශන මාධ්‍යය",
    present_school: "දැනට පාසල (තිබේ නම්)",
    child_address: "ලිපිනය",
    gn_division: "ග්‍රාම නිලධාරි වසම",
    district: "දිස්ත්‍රික්කය",
    province: "පළාත",
    service_status_section: "03. අයදුම්කරුගේ සේවා තත්ත්වය",
    special_info_section: "04. විශේෂ තොරතුරු",
    is_twin: "දරුවා දෙදරු දරුවෙක්ද?",
    special_needs: "විශේෂ අධ්‍යාපන අවශ්‍යතා තිබේද?",
    sports_talents: "ක්‍රීඩා / විශේෂ දක්ෂතා (තිබේ නම්)",
    schools_section: "05. ඉල්ලුම් කරන පාසල් (ප්‍රමුඛතාව අනුව)",
    search: "සෙවීම",
    search_placeholder: "සෙන්සස් අංකය හෝ පාසල් නමෙන් සොයන්න",
    select_school: "පාසල තෝරන්න",
    add: "එකතු කරන්න",
    selected_schools: "තෝරාගත් පාසල් (ප්‍රමුඛතා අනුපිළිවෙල)",
    not_selected: "තෝරා නැත",
    remove: "ඉවත් කරන්න",
    both_parents_section:
      "06. දෙමව්පියන් දෙදෙනාම සන්නද්ධ හමුදාවල සේවය කරන්නේ නම් අනෙකුත් සේවා පුද්ගලයාගේ විස්තර",
    service_number_simple: "සේවා අංකය",
    unit_regiment: "ඒකකය / රෙජිමෙන්තුව",
    other_parent_name_initials: "මුල් අකුරු සමඟ නම",
    other_parent_enlistment_date: "සේවයට බැඳුනු දිනය",
    other_parent_nic: "ජාතික හැඳුනුම්පත් අංකය",
    note_service_certificate:
      "සටහන: අදාල ආඥාදායක / අධිකාරී නිලධාරියා විසින් නිකුත් කරන සේවා සහතිකයක් අමුණා තිබිය යුතුය. එවැනි සහතිකයක් ඉදිරිපත් නොකළහොත් මෙම කාණ්ඩයට අදාළ ලකුණු/ප්‍රමුඛතාව සලකා නොගැනේ.",
    casualty_section:
      "07. පියා හෝ මව සක්‍රීය සේවයේදී මියගිය/අතුරුදහන්/ආබාධිත වූයේ නම් විස්තර",
    casualty_date: "මරණ/අතුරුදහන් වූ දිනය",
    casualty_place: "මරණ/අතුරුදහන් වූ ස්ථානය",
    disability_date: "ආබාධිත වූ දිනය",
    disability_place: "ආබාධිත වූ ස්ථානය",
    disability_percentage: "ආබාධිතත්ව ප්‍රතිශතය",
    disability_on_active: "ආබාධිතත්වය සක්‍රීය සේවයේදී සිදුවීද?",
    disability_nature: "ආබාධයේ ස්වභාවය / වර්ගය",
    note_disability:
      "සටහන: ඇතුළත් වීමේ වසරට පෙර වසරේ ජනවාරි 01 දිනෙන් පසු ලබාගත් වෛද්‍ය වාර්තාවේ පිටපත කොළඹ ආරක්ෂක හමුදා රෝහලෙන් සහතික කර ඉදිරිපත් කළ යුතුය.",
    disability_retired_date: "ආබාධිතත්වය හේතුවෙන් විශ්‍රාම ගත් දිනය",
    medals_section:
      "08. සේවා පුද්ගලයාට ලැබුණු සම්මාන / පදක්කම් විස්තර",
    medal_pwv: "පරම් වීර විභූෂණය (PWV)",
    medal_wv: "වීරෝදාර විභූෂණය (WV)",
    medal_wwv: "වීර වික්‍රම විභූෂණය (WWV)",
    medal_rwm: "රණ වික්‍රම පදක්කම (RWM)",
    medal_rsm: "රණ සූර පදක්කම (RSM)",
    medal_vsv: "විශිෂ්ට සේවා විභූෂණය (VSV)",
    medal_uttama:
      "උත්තම සේවා පදක්කම / කාර්යකුෂල සේවා විභූෂණය",
    medal_deshaputra: "දේශපුත්‍ර සම්මානය",
    sports_section: "09. ක්‍රීඩා ජයග්‍රහණ",
    details: "විස්තර",
    note_sports:
      "සටහන: අදාළ ක්‍රීඩා සහතික පිටපත් බලධාරී නිලධාරියා / ක්‍රීඩා බලධාරියාව විසින් නිකුත් කර හෝ සහතික කර අමුණා තිබිය යුතුය.",
    save_draft: "මූලික සටහන සුරකින්න",
    submit_application: "අයදුම්පත ඉදිරිපත් කරන්න",
    select_unit: "ඒකකය තෝරන්න",
    specify_religion: "ආගම සඳහන් කරන්න",
    yes: "ඔව්",
    no: "නැත",
    male: "පිරිමි",
    female: "කාන්තා",
    buddhist: "බෞද්ධ",
    hindu: "හින්දු",
    islam: "ඉස්ලාම්",
    christian: "ක්‍රිස්තියානි",
    other: "වෙනත්",
    sinhala: "සිංහල",
    tamil: "දෙමළ",
    english: "ඉංග්‍රීසි",
    applicant_note: "වැඩි කාලසීමාවක් ක්‍රියාන්විත සේවයේ යෙදී සිටි පියා හෝ මව",
    status_current: "දැනට සක්‍රීය සේවයේ",
    status_disabled: "සක්‍රීය සේවයේදී ආබාධිත",
    status_deceased: "සක්‍රීය සේවයේදී මියගිය",
    status_retired: "සේවයෙන් විශ්‍රාම ගත්",
    declaration_section: "10. Applicant Declaration",
    declaration_text:
      "I hereby certify that my child is not currently receiving education at any government, private, or recognized school, and has not received such education previously. I further certify that the information stated above by me is true, and I am aware that if any information provided in this application is proven to be false for any reason, this application will be rendered null and void.\n\nFurthermore, I agree that if, even after admission to the school, any information stated in this application is proven to be false, my child will be removed from the said school and admitted to another school nominated by the Ministry of Education without any objection on my part.\n\nI also certify that, regardless of which school is granted from among the schools mentioned in the applications submitted by me, I will admit my child to that school, and that I have submitted an application under the normal admission procedure based on my permanent residence for the purpose of school admission.",
    declaration_agree: "I confirm and agree to the declaration above.",
    declaration_required: "Please confirm the declaration before submitting."
  }
};

export default function ApplicationForm() {
  const { token, profile, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [lang, setLang] = useState("en");
  const [academicYear, setAcademicYear] = useState("2026");
  const [formA, setFormA] = useState(initialFormA);
  const [formB, setFormB] = useState(initialFormB);
  const [schools, setSchools] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [applicationId, setApplicationId] = useState(null);
  const [birthCertFile, setBirthCertFile] = useState(null);
  const [birthCertStatus, setBirthCertStatus] = useState("");
  const [serviceCertFile, setServiceCertFile] = useState(null);
  const [serviceCertStatus, setServiceCertStatus] = useState("");
  const [medicalReportFile, setMedicalReportFile] = useState(null);
  const [medicalReportStatus, setMedicalReportStatus] = useState("");
  const [sportsCertFile, setSportsCertFile] = useState(null);
  const [sportsCertStatus, setSportsCertStatus] = useState("");
  const [status, setStatus] = useState("");
  const [attachments, setAttachments] = useState([]);
  const t = (key) => STRINGS[lang]?.[key] || key;

  const parseJson = (value) => {
    if (!value) return {};
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const normalizeDate = (value) => {
    if (!value) return "";
    if (typeof value === "string" && value.includes("T")) {
      return value.split("T")[0];
    }
    return value;
  };

  const calculateAgeParts = (dobValue, yearValue) => {
    if (!dobValue || !yearValue) return null;
    const dob = new Date(dobValue);
    if (Number.isNaN(dob.getTime())) return null;
    const year = Number(yearValue);
    if (!Number.isFinite(year)) return null;
    const anchor = new Date(year, 0, 31);
    if (dob > anchor) return null;
    let years = anchor.getFullYear() - dob.getFullYear();
    let months = anchor.getMonth() - dob.getMonth();
    let days = anchor.getDate() - dob.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  };

  const loadAttachments = (appId) => {
    if (!token || !appId) {
      setAttachments([]);
      return;
    }
    getAttachments(appId)
      .then((res) => setAttachments(res.data || []))
      .catch(() => setAttachments([]));
  };

  useEffect(() => {
    if (!token) return;
    const medium = formA.medium_of_instruction || "";
    getSchools(medium.toLowerCase())
      .then((res) => setSchools(res.data))
      .catch(() => setSchools([]));
  }, [token, formA.medium_of_instruction]);


  useEffect(() => {
    if (!token || !id) return;
    getApplication(id)
      .then((res) => {
        const data = res.data || {};
        const nextFormA = parseJson(data.form_a_json);
        const nextFormB = parseJson(data.form_b_json);
        setFormA((prev) => ({ ...prev, ...nextFormA }));
        setFormB((prev) => ({ ...prev, ...nextFormB }));
        setAcademicYear(data.academic_year || academicYear);
        setApplicationId(data.id || null);
      })
      .catch(() => {
        setStatus("Failed to load draft.");
      });
  }, [token, id, academicYear]);

  useEffect(() => {
    if (!token || !applicationId) {
      if (!applicationId) setAttachments([]);
      return;
    }
    loadAttachments(applicationId);
  }, [token, applicationId]);

  useEffect(() => {
    if (!profile) return;
    setFormA((prev) => ({
      ...prev,
      applicant_full_name_caps:
        prev.applicant_full_name_caps ||
        (profile.full_name || profile.name_with_initial || "")
          .toUpperCase(),
      applicant_name_initials:
        prev.applicant_name_initials || profile.name_with_initial || "",
      applicant_nic: prev.applicant_nic || profile.nic || "",
      applicant_dob: prev.applicant_dob || normalizeDate(profile.dob),
      unit_name: prev.unit_name || user?.unit_no || "",
      regiment_name: prev.regiment_name || user?.regiment || "",
      service_number:
        prev.service_number || profile.service_no || profile.eno || "",
      rank_designation: prev.rank_designation || profile.rank || "",
      date_of_enlistment:
        prev.date_of_enlistment || normalizeDate(profile.doe),
      contact_number: prev.contact_number || profile.contact_no || ""
    }));
  }, [profile, user]);

  useEffect(() => {
    const age = calculateAgeParts(formA.child_dob, academicYear);
    if (!age) return;
    setFormA((prev) => ({
      ...prev,
      child_age_years: String(age.years),
      child_age_months: String(age.months),
      child_age_days: String(age.days)
    }));
  }, [formA.child_dob, academicYear]);

  const filteredSchools = useMemo(() => {
    const query = schoolSearch.trim().toLowerCase();
    if (!query) return schools;
    return schools.filter((s) => {
      return (
        s.name.toLowerCase().includes(query) ||
        (s.census_no || "").toLowerCase().includes(query)
      );
    });
  }, [schoolSearch, schools]);

  const resolveSchoolSelection = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.toLowerCase();
    const exact = schools.find((s) => {
      const label = s.census_no ? `${s.census_no} - ${s.name}` : s.name;
      return (
        label.toLowerCase() === normalized ||
        (s.census_no || "").toLowerCase() === normalized ||
        s.name.toLowerCase() === normalized
      );
    });
    if (exact) return exact;
    if (filteredSchools.length === 1) return filteredSchools[0];
    return null;
  };

  const submit = async (action, navigateOnSubmit = true) => {
    setStatus("");
    if (action === "submit" && !formA.applicant_declaration_confirmed) {
      setStatus(t("declaration_required"));
      return null;
    }
    try {
      const res = await createOrUpdateApplication({
        formA,
        formB,
        academic_year: academicYear,
        action,
        id: applicationId
      });
      if (res.data?.id) {
        setApplicationId(res.data.id);
      }
      setStatus(action === "submit" ? "Submitted!" : "Saved draft.");
      if (navigateOnSubmit && action === "submit") {
        navigate("/dashboard");
      }
      return res.data?.id || applicationId;
    } catch (err) {
      setStatus(err.response?.data?.error || "Submit failed.");
      return null;
    }
  };

  const renderAttachments = (type) => {
    const files = attachments.filter((file) => file.type === type);
    if (files.length === 0) {
      return <p className="muted">{t("no_attachments")}</p>;
    }
    return (
      <ul className="attachment-list">
        {files.map((file) => (
          <li key={file.id}>
            <a href={`${API_BASE}${file.path}`} target="_blank" rel="noreferrer">
              {file.filename}
            </a>
          </li>
        ))}
      </ul>
    );
  };

  const uploadBirthCert = async () => {
    if (!birthCertFile) return;
    setBirthCertStatus("");
    let currentId = applicationId;
    if (!currentId) {
      const newId = await submit("draft", false);
      if (newId) {
        setApplicationId(newId);
        currentId = newId;
      }
    }
    if (!currentId) {
      setBirthCertStatus(t("upload_error"));
      return;
    }
    try {
      await uploadAttachment(currentId, birthCertFile, "birth_certificate");
      setBirthCertStatus(t("upload_success"));
      loadAttachments(currentId);
    } catch {
      setBirthCertStatus(t("upload_error"));
    }
  };

  const uploadServiceCert = async () => {
    if (!serviceCertFile) return;
    setServiceCertStatus("");
    let currentId = applicationId;
    if (!currentId) {
      const newId = await submit("draft", false);
      if (newId) {
        setApplicationId(newId);
        currentId = newId;
      }
    }
    if (!currentId) {
      setServiceCertStatus(t("upload_error"));
      return;
    }
    try {
      await uploadAttachment(currentId, serviceCertFile, "service_certificate");
      setServiceCertStatus(t("upload_success"));
      loadAttachments(currentId);
    } catch {
      setServiceCertStatus(t("upload_error"));
    }
  };

  const uploadMedicalReport = async () => {
    if (!medicalReportFile) return;
    setMedicalReportStatus("");
    let currentId = applicationId;
    if (!currentId) {
      const newId = await submit("draft", false);
      if (newId) {
        setApplicationId(newId);
        currentId = newId;
      }
    }
    if (!currentId) {
      setMedicalReportStatus(t("upload_error"));
      return;
    }
    try {
      await uploadAttachment(currentId, medicalReportFile, "medical_report");
      setMedicalReportStatus(t("upload_success"));
      loadAttachments(currentId);
    } catch {
      setMedicalReportStatus(t("upload_error"));
    }
  };

  const uploadSportsCert = async () => {
    if (!sportsCertFile) return;
    setSportsCertStatus("");
    let currentId = applicationId;
    if (!currentId) {
      const newId = await submit("draft", false);
      if (newId) {
        setApplicationId(newId);
        currentId = newId;
      }
    }
    if (!currentId) {
      setSportsCertStatus(t("upload_error"));
      return;
    }
    try {
      await uploadAttachment(currentId, sportsCertFile, "sports_certificate");
      setSportsCertStatus(t("upload_success"));
      loadAttachments(currentId);
    } catch {
      setSportsCertStatus(t("upload_error"));
    }
  };

  return (
    <div className="page form-page">
      <div className="form-header">
        <h2>{t("title")}</h2>
        <div className="lang-toggle">
          <button
            type="button"
            className={`lang-btn ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={`lang-btn ${lang === "si" ? "active" : ""}`}
            onClick={() => setLang("si")}
          >
            සිං
          </button>
        </div>
      </div>
      <div className="info-banner">{t("application_notice")}</div>
      <div className="form-section">
        <h3>{t("applicant_section")}</h3>
        <div className="info-banner">{t("applicant_note")}</div>
        <div className="form-grid">
          <label>
            {t("full_name_caps")}
            <input
              value={formA.applicant_full_name_caps}
              onChange={(e) =>
                setFormA({ ...formA, applicant_full_name_caps: e.target.value })
              }
              required
            />
          </label>
          <label>
            {t("name_initials")}
            <input
              value={formA.applicant_name_initials}
              onChange={(e) =>
                setFormA({ ...formA, applicant_name_initials: e.target.value })
              }
              required
            />
          </label>
          <label>
            {t("nic")}
            <input
              value={formA.applicant_nic}
              onChange={(e) =>
                setFormA({ ...formA, applicant_nic: e.target.value })
              }
              required
            />
          </label>
          <label>
            {t("dob")}
            <input
              type="date"
              value={formA.applicant_dob}
              onChange={(e) =>
                setFormA({ ...formA, applicant_dob: e.target.value })
              }
              required
            />
          </label>
        </div>

        <div className="stacked-block">
          <div className="label-title">{t("regiment")}</div>
          <input
            value={formA.regiment_name}
            onChange={(e) =>
              setFormA({ ...formA, regiment_name: e.target.value })
            }
            required
          />
        </div>

        <div className="stacked-block">
          <div className="label-title">{t("unit")}</div>
          <input
            value={formA.unit_name}
            onChange={(e) => setFormA({ ...formA, unit_name: e.target.value })}
            required
          />
        </div>

        <div className="form-grid">
          <label>
            {t("service_no")}
            <input
              value={formA.service_number}
              onChange={(e) =>
                setFormA({ ...formA, service_number: e.target.value })
              }
              readOnly
              required
            />
          </label>
          <label>
            {t("prev_service_no")}
            <input
              value={formA.previous_service_number}
              onChange={(e) =>
                setFormA({ ...formA, previous_service_number: e.target.value })
              }
            />
          </label>
          <label>
            {t("rank")}
            <input
              value={formA.rank_designation}
              onChange={(e) =>
                setFormA({ ...formA, rank_designation: e.target.value })
              }
            />
          </label>
          <label>
            {t("enlistment_date")}
            <input
              type="date"
              value={formA.date_of_enlistment}
              onChange={(e) =>
                setFormA({ ...formA, date_of_enlistment: e.target.value })
              }
            />
          </label>
          <label>
            {t("present_workplace")}
            <input
              value={formA.present_workplace}
              onChange={(e) =>
                setFormA({ ...formA, present_workplace: e.target.value })
              }
            />
          </label>
          <label>
            {t("permanent_address")}
            <input
              value={formA.permanent_address}
              onChange={(e) =>
                setFormA({ ...formA, permanent_address: e.target.value })
              }
            />
          </label>
          <label>
            {t("contact_number")}
            <input
              value={formA.contact_number}
              onChange={(e) =>
                setFormA({ ...formA, contact_number: e.target.value })
              }
              required
            />
          </label>
        </div>
      </div>

      <div className="form-section option-inline">
        <h3>{t("applicant_religion")}</h3>
        <div className="option-grid">
          {[
            { value: "Buddhist", label: t("buddhist") },
            { value: "Hindu", label: t("hindu") },
            { value: "Islam", label: t("islam") },
            { value: "Christian", label: t("christian") },
            { value: "Other", label: t("other") }
          ].map((opt) => (
            <label key={opt.value} className="option">
              <input
                type="radio"
                name="applicant_religion"
                value={opt.value}
                checked={formA.applicant_religion === opt.value}
                onChange={(e) =>
                  setFormA({ ...formA, applicant_religion: e.target.value })
                }
              />
              {opt.label}
            </label>
          ))}
          {formA.applicant_religion === "Other" && (
            <input
              className="inline-input"
              placeholder={t("specify_religion")}
              value={formA.applicant_religion_other}
              onChange={(e) =>
                setFormA({ ...formA, applicant_religion_other: e.target.value })
              }
            />
          )}
        </div>
      </div>

      <div className="form-section">
        <h3>{t("child_section")}</h3>
        <p className="muted">{t("child_note")}</p>
        <label>
          {t("birth_upload_label")}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setBirthCertFile(e.target.files?.[0] || null)}
          />
        </label>
        <button type="button" className="ghost-btn" onClick={uploadBirthCert}>
          {t("upload_button")}
        </button>
        {birthCertStatus && <div className="notice">{birthCertStatus}</div>}
        <div className="stacked-block">
          <div className="label-title">{t("uploaded_attachments")}</div>
          {renderAttachments("birth_certificate")}
        </div>
        <div className="form-grid">
          <label>
            {t("child_full_name_caps")}
            <input
              value={formA.child_full_name_caps}
              onChange={(e) =>
                setFormA({ ...formA, child_full_name_caps: e.target.value })
              }
              required
            />
          </label>
          <label>
            {t("child_name_initials")}
            <input
              value={formA.child_name_initials}
              onChange={(e) =>
                setFormA({ ...formA, child_name_initials: e.target.value })
              }
              required
            />
          </label>
          <label>
            {t("child_dob")}
            <input
              type="date"
              value={formA.child_dob}
              onChange={(e) => setFormA({ ...formA, child_dob: e.target.value })}
              required
            />
          </label>
          <label>
            {t("child_age_years")}
            <input
              value={formA.child_age_years}
              onChange={(e) =>
                setFormA({ ...formA, child_age_years: e.target.value })
              }
              readOnly
            />
          </label>
          <label>
            {t("child_age_months")}
            <input
              value={formA.child_age_months}
              onChange={(e) =>
                setFormA({ ...formA, child_age_months: e.target.value })
              }
              readOnly
            />
          </label>
          <label>
            {t("child_age_days")}
            <input
              value={formA.child_age_days}
              onChange={(e) =>
                setFormA({ ...formA, child_age_days: e.target.value })
              }
              readOnly
            />
          </label>
        </div>

        <div className="option-section option-inline">
          <div className="label-title">{t("gender")}</div>
          <div className="option-grid">
            {[
              { value: "Male", label: t("male") },
              { value: "Female", label: t("female") }
            ].map((opt) => (
              <label key={opt} className="option">
                <input
                  type="radio"
                  name="child_gender"
                  value={opt.value}
                  checked={formA.child_gender === opt.value}
                  onChange={(e) =>
                    setFormA({ ...formA, child_gender: e.target.value })
                  }
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="option-section option-inline">
          <div className="label-title">{t("religion")}</div>
          <div className="option-grid">
            {[
              { value: "Buddhist", label: t("buddhist") },
              { value: "Hindu", label: t("hindu") },
              { value: "Islam", label: t("islam") },
              { value: "Christian", label: t("christian") },
              { value: "Other", label: t("other") }
            ].map((opt) => (
              <label key={opt} className="option">
                <input
                  type="radio"
                  name="child_religion"
                  value={opt.value}
                  checked={formA.child_religion === opt.value}
                  onChange={(e) =>
                    setFormA({ ...formA, child_religion: e.target.value })
                  }
                />
                {opt.label}
              </label>
            ))}
            {formA.child_religion === "Other" && (
              <input
                className="inline-input"
                placeholder={t("specify_religion")}
                value={formA.child_religion_other}
                onChange={(e) =>
                  setFormA({ ...formA, child_religion_other: e.target.value })
                }
              />
            )}
          </div>
        </div>

        <div className="option-section option-inline">
          <div className="label-title">{t("medium")}</div>
          <div className="option-grid">
            {[
              { value: "Sinhala", label: t("sinhala") },
              { value: "Tamil", label: t("tamil") },
              { value: "English", label: t("english") }
            ].map((opt) => (
              <label key={opt} className="option">
                <input
                  type="radio"
                  name="medium_of_instruction"
                  value={opt.value}
                  checked={formA.medium_of_instruction === opt.value}
                  onChange={(e) =>
                    setFormA({ ...formA, medium_of_instruction: e.target.value })
                  }
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-grid">
          <label>
            {t("present_school")}
            <input
              value={formA.present_school}
              onChange={(e) =>
                setFormA({ ...formA, present_school: e.target.value })
              }
            />
          </label>
          <label>
            {t("child_address")}
            <input
              value={formA.child_address}
              onChange={(e) =>
                setFormA({ ...formA, child_address: e.target.value })
              }
            />
          </label>
          <label>
            {t("gn_division")}
            <input
              value={formA.child_gn_division}
              onChange={(e) =>
                setFormA({ ...formA, child_gn_division: e.target.value })
              }
            />
          </label>
          <label>
            {t("district")}
            <input
              value={formA.child_district}
              onChange={(e) =>
                setFormA({ ...formA, child_district: e.target.value })
              }
            />
          </label>
          <label>
            {t("province")}
            <input
              value={formA.child_province}
              onChange={(e) =>
                setFormA({ ...formA, child_province: e.target.value })
              }
            />
          </label>
        </div>
      </div>

      <div className="form-section option-inline">
        <h3>{t("service_status_section")}</h3>
        <div className="option-grid">
          {[
            { value: "Currently in active service", label: t("status_current") },
            { value: "Disabled while on active duty", label: t("status_disabled") },
            { value: "Deceased while on active duty", label: t("status_deceased") },
            { value: "Retired from service", label: t("status_retired") }
          ].map((opt) => (
            <label key={opt.value} className="option">
              <input
                type="radio"
                name="service_status"
                value={opt.value}
                checked={formA.service_status === opt.value}
                onChange={(e) =>
                  setFormA({ ...formA, service_status: e.target.value })
                }
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3>{t("special_info_section")}</h3>
        <div className="option-section option-inline">
          <div className="label-title">{t("is_twin")}</div>
          <div className="option-grid">
            {[
              { value: "Yes", label: t("yes") },
              { value: "No", label: t("no") }
            ].map((opt) => (
              <label key={opt.value} className="option">
                <input
                  type="radio"
                  name="is_twin"
                  value={opt.value}
                  checked={formA.is_twin === opt.value}
                  onChange={(e) => setFormA({ ...formA, is_twin: e.target.value })}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <div className="option-section option-inline">
          <div className="label-title">{t("special_needs")}</div>
          <div className="option-grid">
            {[
              { value: "Yes", label: t("yes") },
              { value: "No", label: t("no") }
            ].map((opt) => (
              <label key={opt.value} className="option">
                <input
                  type="radio"
                  name="has_special_needs"
                  value={opt.value}
                  checked={formA.has_special_needs === opt.value}
                  onChange={(e) =>
                    setFormA({ ...formA, has_special_needs: e.target.value })
                  }
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        <label>
          {t("sports_talents")}
          <input
            value={formA.special_talents}
            onChange={(e) =>
              setFormA({ ...formA, special_talents: e.target.value })
            }
          />
        </label>
      </div>

      <div className="form-section">
        <h3>{t("schools_section")}</h3>
        <div className="school-picker">
          <label className="school-search-label">
            {t("search")}
            <input
              className="school-search"
              list="school-options"
              placeholder={t("search_placeholder")}
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
            />
            <datalist id="school-options">
              {filteredSchools.map((s) => (
                <option
                  key={`${s.census_no}-${s.name}`}
                  value={s.census_no ? `${s.census_no} - ${s.name}` : s.name}
                />
              ))}
            </datalist>
          </label>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              const selected = resolveSchoolSelection(schoolSearch);
              if (!selected) return;
              const alreadyChosen = formA.schools.some(
                (s) => s.census_no === selected.census_no
              );
              if (alreadyChosen) return;
              const next = [...formA.schools];
              const emptyIndex = next.findIndex((s) => !s.census_no);
              if (emptyIndex === -1) return;
              next[emptyIndex] = {
                ...next[emptyIndex],
                census_no: selected.census_no || "",
                name: selected.name || ""
              };
              setFormA({ ...formA, schools: next });
              setSchoolSearch("");
            }}
          >
            {t("add")}
          </button>
        </div>
        <div className="school-list">
          <div className="school-header">{t("selected_schools")}</div>
          {formA.schools.map((school, idx) => (
            <div key={school.priority} className="school-row">
              <span className="school-priority">{school.priority}</span>
              <div className="school-selected">
                <span>
                  {school.census_no
                    ? `${school.census_no} - ${school.name}`
                    : t("not_selected")}
                </span>
                {school.census_no && (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      const next = [...formA.schools];
                      next[idx] = { ...next[idx], census_no: "", name: "" };
                      setFormA({ ...formA, schools: next });
                    }}
                  >
                    {t("remove")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3>{t("both_parents_section")}</h3>
        <div className="form-grid">
          <label>
            {t("service_number_simple")}
            <input
              value={formA.other_parent_service_no}
              onChange={(e) =>
                setFormA({ ...formA, other_parent_service_no: e.target.value })
              }
            />
          </label>
          <label>
            {t("rank")}
            <input
              value={formA.other_parent_rank}
              onChange={(e) =>
                setFormA({ ...formA, other_parent_rank: e.target.value })
              }
            />
          </label>
          <label>
            {t("unit_regiment")}
            <input
              value={formA.other_parent_unit}
              onChange={(e) =>
                setFormA({ ...formA, other_parent_unit: e.target.value })
              }
            />
          </label>
          <label>
            {t("other_parent_name_initials")}
            <input
              value={formA.other_parent_name_initials}
              onChange={(e) =>
                setFormA({
                  ...formA,
                  other_parent_name_initials: e.target.value
                })
              }
            />
          </label>
          <label>
            {t("other_parent_enlistment_date")}
            <input
              type="date"
              value={formA.other_parent_enlistment_date}
              onChange={(e) =>
                setFormA({
                  ...formA,
                  other_parent_enlistment_date: e.target.value
                })
              }
            />
          </label>
          <label>
            {t("other_parent_nic")}
            <input
              value={formA.other_parent_nic}
              onChange={(e) =>
                setFormA({ ...formA, other_parent_nic: e.target.value })
              }
            />
          </label>
        </div>
        <p className="muted">
          {t("note_service_certificate")}
        </p>
        <label>
          Service Certificate (PDF/JPG/PNG)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setServiceCertFile(e.target.files?.[0] || null)}
          />
        </label>
        <button type="button" className="ghost-btn" onClick={uploadServiceCert}>
          {t("upload_button")}
        </button>
        {serviceCertStatus && <div className="notice">{serviceCertStatus}</div>}
        <div className="stacked-block">
          <div className="label-title">{t("uploaded_attachments")}</div>
          {renderAttachments("service_certificate")}
        </div>
      </div>

      <div className="form-section">
        <h3>{t("casualty_section")}</h3>
        <div className="form-grid">
          <label>
            {t("casualty_date")}
            <input
              type="date"
              value={formA.casualty_date}
              onChange={(e) =>
                setFormA({ ...formA, casualty_date: e.target.value })
              }
            />
          </label>
          <label>
            {t("casualty_place")}
            <input
              value={formA.casualty_place}
              onChange={(e) =>
                setFormA({ ...formA, casualty_place: e.target.value })
              }
            />
          </label>
          <label>
            {t("disability_date")}
            <input
              type="date"
              value={formA.disability_date}
              onChange={(e) =>
                setFormA({ ...formA, disability_date: e.target.value })
              }
            />
          </label>
          <label>
            {t("disability_place")}
            <input
              value={formA.disability_place}
              onChange={(e) =>
                setFormA({ ...formA, disability_place: e.target.value })
              }
            />
          </label>
          <label>
            {t("disability_percentage")}
            <input
              value={formA.disability_percentage}
              onChange={(e) =>
                setFormA({ ...formA, disability_percentage: e.target.value })
              }
              placeholder="e.g., 40"
            />
          </label>
        </div>

        <div className="option-section option-inline">
          <div className="label-title">{t("disability_on_active")}</div>
          <div className="option-grid">
            {[
              { value: "Yes", label: t("yes") },
              { value: "No", label: t("no") }
            ].map((opt) => (
              <label key={opt.value} className="option">
                <input
                  type="radio"
                  name="disability_on_active_service"
                  value={opt.value}
                  checked={formA.disability_on_active_service === opt.value}
                  onChange={(e) =>
                    setFormA({
                      ...formA,
                      disability_on_active_service: e.target.value
                    })
                  }
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <label>
          {t("disability_nature")}
          <input
            value={formA.disability_nature}
            onChange={(e) =>
              setFormA({ ...formA, disability_nature: e.target.value })
            }
          />
        </label>

        <label>
          {t("disability_retired_date")}
          <input
            type="date"
            value={formA.disability_retired_date}
            onChange={(e) =>
              setFormA({ ...formA, disability_retired_date: e.target.value })
            }
          />
        </label>

        <p className="muted">{t("note_disability")}</p>
        <label>
          Medical Report (PDF/JPG/PNG)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setMedicalReportFile(e.target.files?.[0] || null)}
          />
        </label>
        <button type="button" className="ghost-btn" onClick={uploadMedicalReport}>
          {t("upload_button")}
        </button>
        {medicalReportStatus && (
          <div className="notice">{medicalReportStatus}</div>
        )}
        <div className="stacked-block">
          <div className="label-title">{t("uploaded_attachments")}</div>
          {renderAttachments("medical_report")}
        </div>
      </div>

      <div className="form-section">
        <h3>{t("medals_section")}</h3>
        <div className="decorations-table">
          <div className="decorations-head">Awarded Decorations</div>
          <div className="decorations-head">Awarded Times</div>
          <div className="decorations-head">Army Order No</div>
          {formA.decorations.map((item, idx) => (
            <React.Fragment key={item.name}>
              <div className="decorations-cell">{item.name}</div>
              <div className="decorations-cell">
                <input
                  value={item.times}
                  onChange={(e) => {
                    const next = [...formA.decorations];
                    next[idx] = { ...item, times: e.target.value };
                    setFormA({ ...formA, decorations: next });
                  }}
                />
              </div>
              <div className="decorations-cell">
                <input
                  value={item.order_no}
                  onChange={(e) => {
                    const next = [...formA.decorations];
                    next[idx] = { ...item, order_no: e.target.value };
                    setFormA({ ...formA, decorations: next });
                  }}
                />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3>{t("sports_section")}</h3>
        <label>
          {t("details")}
          <textarea
            value={formA.sports_achievements}
            onChange={(e) =>
              setFormA({ ...formA, sports_achievements: e.target.value })
            }
          />
        </label>
        <p className="muted">
          {t("note_sports")}
        </p>
        <label>
          Sports Certificate (PDF/JPG/PNG)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setSportsCertFile(e.target.files?.[0] || null)}
          />
        </label>
        <button type="button" className="ghost-btn" onClick={uploadSportsCert}>
          {t("upload_button")}
        </button>
        {sportsCertStatus && (
          <div className="notice">{sportsCertStatus}</div>
        )}
        <div className="stacked-block">
          <div className="label-title">{t("uploaded_attachments")}</div>
          {renderAttachments("sports_certificate")}
        </div>
      </div>

      <div className="form-section">
        <h3>{t("declaration_section")}</h3>
        <div className="muted declaration-text">{t("declaration_text")}</div>
        <label className="option">
          <input
            type="checkbox"
            checked={!!formA.applicant_declaration_confirmed}
            onChange={(e) =>
              setFormA({
                ...formA,
                applicant_declaration_confirmed: e.target.checked
              })
            }
          />
          {t("declaration_agree")}
        </label>
      </div>

      {status && <div className="notice">{status}</div>}
      <div className="form-actions">
        <button className="ghost-btn" onClick={() => submit("draft", false)}>
          {t("save_draft")}
        </button>
        <button className="primary-btn" onClick={() => submit("submit")}>
          {t("submit_application")}
        </button>
      </div>
    </div>
  );
}
