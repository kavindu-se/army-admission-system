@extends('layouts.app')

@section('content')
@php
  $fa = $formA ?? [];
  $decorations = $fa['decorations'] ?? [
    ['name' => 'Param Weera Vibhushanaya (PWV)', 'times' => '', 'order_no' => ''],
    ['name' => 'Weerodara Vibhushanaya (WV)', 'times' => '', 'order_no' => ''],
    ['name' => 'Weera Wickrama Vibhushanaya (WWV)', 'times' => '', 'order_no' => ''],
    ['name' => 'Rana Wickrama Medal (RWM)', 'times' => '', 'order_no' => ''],
    ['name' => 'Rana Sura Medal (RSM)', 'times' => '', 'order_no' => ''],
    ['name' => 'Vishista Seva Vibhushanaya (VSV)', 'times' => '', 'order_no' => ''],
    ['name' => 'Uttama Seva Padakkama / Karyakshama Seva Vibhushanaya', 'times' => '', 'order_no' => ''],
    ['name' => 'Deshaputra Sammanaya', 'times' => '', 'order_no' => ''],
  ];
  $schools = $fa['schools'] ?? array_map(function ($i) {
    return ['priority' => str_pad($i, 2, '0', STR_PAD_LEFT), 'census_no' => '', 'name' => ''];
  }, range(1, 10));
  $attachmentsByType = collect($attachments ?? [])->groupBy('type');
@endphp

<div class="form-page">
  <div class="form-header">
    <div>
      <h1>Grade 1 Admission Application</h1>
      <p class="muted">Complete the application details and upload attachments.</p>
    </div>
    <div class="lang-toggle">
      <button type="button" class="lang-btn" data-lang="si">සිං</button>
      <button type="button" class="lang-btn active" data-lang="en">EN</button>
      <a class="ghost-btn" href="{{ route('dashboard') }}">Back</a>
    </div>
  </div>

  <div class="info-banner" data-note="application_notice">
    All applicants must submit their applications under the residential basis / past pupil basis / sibling basis. However, there are instances where, after such submission, principals refuse even to subject applicants to interviews and instead instruct them to submit applications through military channels. In such situations, the matter should be reported in writing to the Welfare Directorate immediately.
  </div>

  <form method="POST" action="{{ $application ? route('applications.update', $application) : route('applications.store') }}" class="form-grid">
    @csrf
    @if($application)
      @method('PUT')
    @endif

    <section class="form-section">
      <h3>01. Particulars of the Applicant (Service Person / Guardian)</h3>
      <div class="form-grid">
        <label>
          Academic Year
          <input name="academic_year" value="{{ $application->academic_year ?? '2026' }}" required>
        </label>
        <label>
          Full Name (IN CAPITAL LETTERS)
          <input name="formA[applicant_full_name_caps]" value="{{ $fa['applicant_full_name_caps'] ?? '' }}">
        </label>
        <label>
          Name with Initials
          <input name="formA[applicant_name_initials]" value="{{ $fa['applicant_name_initials'] ?? '' }}">
        </label>
        <label>
          National Identity Card (NIC) No
          <input name="formA[applicant_nic]" value="{{ $fa['applicant_nic'] ?? '' }}">
        </label>
        <label>
          Date of Birth
          <input type="date" name="formA[applicant_dob]" value="{{ $fa['applicant_dob'] ?? '' }}">
        </label>
        <label>
          Regiment
          <input name="formA[regiment_name]" value="{{ $fa['regiment_name'] ?? '' }}">
        </label>
        <label>
          Unit
          <input name="formA[unit_name]" value="{{ $fa['unit_name'] ?? '' }}">
        </label>
        <label>
          Service Number / Force Number
          <input name="formA[service_number]" value="{{ $fa['service_number'] ?? '' }}">
        </label>
        <label>
          Previous Service Number (if any)
          <input name="formA[previous_service_number]" value="{{ $fa['previous_service_number'] ?? '' }}">
        </label>
        <label>
          Rank / Designation
          <input name="formA[rank_designation]" value="{{ $fa['rank_designation'] ?? '' }}">
        </label>
        <label>
          Date of Enlistment / Appointment
          <input type="date" name="formA[date_of_enlistment]" value="{{ $fa['date_of_enlistment'] ?? '' }}">
        </label>
        <label>
          Present Place of Work / Service Station
          <input name="formA[present_workplace]" value="{{ $fa['present_workplace'] ?? '' }}">
        </label>
        <label>
          Permanent Address
          <input name="formA[permanent_address]" value="{{ $fa['permanent_address'] ?? '' }}">
        </label>
        <label>
          Contact Number
          <input name="formA[contact_number]" value="{{ $fa['contact_number'] ?? '' }}">
        </label>
      </div>
      <div class="muted" data-note="applicant_note">
        A father or mother who served in active operational duty for a longer period of time.
      </div>
    </section>

    <section class="form-section">
      <h3>02. Particulars of the Child</h3>
      <div class="muted" data-note="child_note">A certified photocopy of the birth certificate should be attached.</div>
      <div class="form-grid">
        <label>
          Full Name of the Child (IN CAPITAL LETTERS)
          <input name="formA[child_full_name_caps]" value="{{ $fa['child_full_name_caps'] ?? '' }}">
        </label>
        <label>
          Name with Initials
          <input name="formA[child_name_initials]" value="{{ $fa['child_name_initials'] ?? '' }}">
        </label>
        <label>
          Date of Birth
          <input type="date" name="formA[child_dob]" value="{{ $fa['child_dob'] ?? '' }}">
        </label>
        <label>
          Age (Years)
          <input name="formA[child_age_years]" value="{{ $fa['child_age_years'] ?? '' }}">
        </label>
        <label>
          Age (Months)
          <input name="formA[child_age_months]" value="{{ $fa['child_age_months'] ?? '' }}">
        </label>
        <label>
          Age (Days)
          <input name="formA[child_age_days]" value="{{ $fa['child_age_days'] ?? '' }}">
        </label>
      </div>

      <div class="option-section option-inline">
        <div class="label-title">Gender</div>
        <div class="option-grid">
          @foreach(['Male','Female'] as $opt)
            <label class="option">
              <input type="radio" name="formA[child_gender]" value="{{ $opt }}" {{ ($fa['child_gender'] ?? '') === $opt ? 'checked' : '' }}>
              {{ $opt }}
            </label>
          @endforeach
        </div>
      </div>

      <div class="option-section option-inline">
        <div class="label-title">Religion</div>
        <div class="option-grid">
          @foreach(['Buddhist','Hindu','Islam','Christian','Other'] as $opt)
            <label class="option">
              <input type="radio" name="formA[child_religion]" value="{{ $opt }}" {{ ($fa['child_religion'] ?? '') === $opt ? 'checked' : '' }}>
              {{ $opt }}
            </label>
          @endforeach
          @if(($fa['child_religion'] ?? '') === 'Other')
            <input class="inline-input" name="formA[child_religion_other]" value="{{ $fa['child_religion_other'] ?? '' }}" placeholder="Specify religion">
          @endif
        </div>
      </div>

      <div class="option-section option-inline">
        <div class="label-title">Medium of Instruction</div>
        <div class="option-grid">
          @foreach(['Sinhala','Tamil','English'] as $opt)
            <label class="option">
              <input type="radio" name="formA[medium_of_instruction]" value="{{ $opt }}" {{ ($fa['medium_of_instruction'] ?? '') === $opt ? 'checked' : '' }}>
              {{ $opt }}
            </label>
          @endforeach
        </div>
      </div>

      <div class="form-grid">
        <label>
          Present School (if any)
          <input name="formA[present_school]" value="{{ $fa['present_school'] ?? '' }}">
        </label>
        <label>
          Address
          <input name="formA[child_address]" value="{{ $fa['child_address'] ?? '' }}">
        </label>
        <label>
          Grama Niladhari Division
          <input name="formA[child_gn_division]" value="{{ $fa['child_gn_division'] ?? '' }}">
        </label>
        <label>
          District
          <input name="formA[child_district]" value="{{ $fa['child_district'] ?? '' }}">
        </label>
        <label>
          Province
          <input name="formA[child_province]" value="{{ $fa['child_province'] ?? '' }}">
        </label>
      </div>

      @if($application)
      <div class="attachment-block">
        <form method="POST" enctype="multipart/form-data" action="{{ route('applications.attachments.upload', $application) }}" class="form-actions">
          @csrf
          <input type="hidden" name="type" value="birth_certificate">
          <label>
            Birth Certificate (PDF/JPG/PNG)
            <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png">
          </label>
          <button class="primary-btn" type="submit">Upload</button>
        </form>
        <div class="stacked-block">
          <div class="label-title">Uploaded attachments</div>
          <ul class="attachment-list">
            @foreach(($attachmentsByType['birth_certificate'] ?? []) as $file)
              <li><a href="{{ route('attachments.download', $file) }}">{{ $file->filename }}</a></li>
            @endforeach
          </ul>
        </div>
      </div>
      @endif
    </section>

    <section class="form-section option-inline">
      <h3>03. Service Status of the Applicant</h3>
      <div class="option-grid">
        @foreach(['Currently in active service','Disabled while on active duty','Deceased while on active duty','Retired from service'] as $opt)
          <label class="option">
            <input type="radio" name="formA[service_status]" value="{{ $opt }}" {{ ($fa['service_status'] ?? '') === $opt ? 'checked' : '' }}>
            {{ $opt }}
          </label>
        @endforeach
      </div>
    </section>

    <section class="form-section">
      <h3>04. Special Information</h3>
      <div class="option-section option-inline">
        <div class="label-title">Is the child a twin?</div>
        <div class="option-grid">
          @foreach(['Yes','No'] as $opt)
            <label class="option">
              <input type="radio" name="formA[is_twin]" value="{{ $opt }}" {{ ($fa['is_twin'] ?? '') === $opt ? 'checked' : '' }}>
              {{ $opt }}
            </label>
          @endforeach
        </div>
      </div>
      <div class="option-section option-inline">
        <div class="label-title">Special educational needs?</div>
        <div class="option-grid">
          @foreach(['Yes','No'] as $opt)
            <label class="option">
              <input type="radio" name="formA[has_special_needs]" value="{{ $opt }}" {{ ($fa['has_special_needs'] ?? '') === $opt ? 'checked' : '' }}>
              {{ $opt }}
            </label>
          @endforeach
        </div>
      </div>
      <label>
        Sports / Special Talents (if any)
        <input name="formA[special_talents]" value="{{ $fa['special_talents'] ?? '' }}">
      </label>
    </section>

    <section class="form-section">
      <h3>05. Schools Applied For (In Order of Priority)</h3>
      <div class="school-picker">
        <label class="school-search-label">
          Search
          <input class="school-search" list="school-options" type="text" placeholder="Search by census number or school name">
          <datalist id="school-options"></datalist>
        </label>
        <button type="button" class="ghost-btn" id="school-apply">Add</button>
      </div>
      <div class="school-list">
        <div class="school-header">Selected Schools (Priority Order)</div>
        @foreach($schools as $idx => $school)
          <div class="school-row">
            <span class="school-priority">{{ $school['priority'] ?? '' }}</span>
            <div class="school-selected">
              <span data-selected-text="{{ $idx }}">{{ $school['census_no'] ? $school['census_no'].' - '.$school['name'] : 'Not selected' }}</span>
              @if($school['census_no'])
                <button type="button" class="ghost-btn" data-clear-school="{{ $idx }}">Remove</button>
              @endif
            </div>
            <input type="hidden" name="formA[schools][{{ $idx }}][priority]" value="{{ $school['priority'] ?? '' }}">
            <input type="hidden" name="formA[schools][{{ $idx }}][census_no]" value="{{ $school['census_no'] ?? '' }}" data-school-census="{{ $idx }}">
            <input type="hidden" name="formA[schools][{{ $idx }}][name]" value="{{ $school['name'] ?? '' }}" data-school-name="{{ $idx }}">
          </div>
        @endforeach
      </div>
    </section>

    <section class="form-section">
      <h3>06. If both parents are serving in the Armed Forces, provide details of the other service person</h3>
      <div class="form-grid">
        <label>
          Service Number
          <input name="formA[other_parent_service_no]" value="{{ $fa['other_parent_service_no'] ?? '' }}">
        </label>
        <label>
          Rank
          <input name="formA[other_parent_rank]" value="{{ $fa['other_parent_rank'] ?? '' }}">
        </label>
        <label>
          Unit / Regiment
          <input name="formA[other_parent_unit]" value="{{ $fa['other_parent_unit'] ?? '' }}">
        </label>
        <label>
          Name with Initials
          <input name="formA[other_parent_name_initials]" value="{{ $fa['other_parent_name_initials'] ?? '' }}">
        </label>
        <label>
          Date of Enlistment
          <input type="date" name="formA[other_parent_enlistment_date]" value="{{ $fa['other_parent_enlistment_date'] ?? '' }}">
        </label>
        <label>
          National Identity Card (NIC) No.
          <input name="formA[other_parent_nic]" value="{{ $fa['other_parent_nic'] ?? '' }}">
        </label>
      </div>
      <p class="muted" data-note="note_service_certificate">Note: A service certificate issued by the relevant Commanding / Authorizing Officer must be attached. If such certification is not submitted, marks/priority for this category will not be considered.</p>
      @if($application)
      <div class="attachment-block">
        <form method="POST" enctype="multipart/form-data" action="{{ route('applications.attachments.upload', $application) }}" class="form-actions">
          @csrf
          <input type="hidden" name="type" value="service_certificate">
          <label>
            Service Certificate (PDF/JPG/PNG)
            <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png">
          </label>
          <button class="primary-btn" type="submit">Upload</button>
        </form>
        <div class="stacked-block">
          <div class="label-title">Uploaded attachments</div>
          <ul class="attachment-list">
            @foreach(($attachmentsByType['service_certificate'] ?? []) as $file)
              <li><a href="{{ route('attachments.download', $file) }}">{{ $file->filename }}</a></li>
            @endforeach
          </ul>
        </div>
      </div>
      @endif
    </section>

    <section class="form-section">
      <h3>07. If the Father or Mother was Killed, Missing or Disabled while on Active Service, provide details</h3>
      <div class="form-grid">
        <label>
          Date of Death / Missing
          <input type="date" name="formA[casualty_date]" value="{{ $fa['casualty_date'] ?? '' }}">
        </label>
        <label>
          Place of Death / Missing
          <input name="formA[casualty_place]" value="{{ $fa['casualty_place'] ?? '' }}">
        </label>
        <label>
          Disability Date
          <input type="date" name="formA[disability_date]" value="{{ $fa['disability_date'] ?? '' }}">
        </label>
        <label>
          Disability Place
          <input name="formA[disability_place]" value="{{ $fa['disability_place'] ?? '' }}">
        </label>
        <label>
          Percentage of Disability
          <input name="formA[disability_percentage]" value="{{ $fa['disability_percentage'] ?? '' }}">
        </label>
      </div>
      <div class="option-section option-inline">
        <div class="label-title">Whether the disability occurred while on active service</div>
        <div class="option-grid">
          @foreach(['Yes','No'] as $opt)
            <label class="option">
              <input type="radio" name="formA[disability_on_active_service]" value="{{ $opt }}" {{ ($fa['disability_on_active_service'] ?? '') === $opt ? 'checked' : '' }}>
              {{ $opt }}
            </label>
          @endforeach
        </div>
      </div>
      <label>
        Nature / Type of Disability
        <input name="formA[disability_nature]" value="{{ $fa['disability_nature'] ?? '' }}">
      </label>
      <label>
        If retired due to disability, date of retirement
        <input type="date" name="formA[disability_retired_date]" value="{{ $fa['disability_retired_date'] ?? '' }}">
      </label>
      <p class="muted" data-note="note_disability">Note: attach copy of the medical report obtained after 01 January of the year preceding the year of admission must be certified by the Army Hospital, Colombo, and submitted.</p>
      @if($application)
      <div class="attachment-block">
        <form method="POST" enctype="multipart/form-data" action="{{ route('applications.attachments.upload', $application) }}" class="form-actions">
          @csrf
          <input type="hidden" name="type" value="medical_report">
          <label>
            Medical Report (PDF/JPG/PNG)
            <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png">
          </label>
          <button class="primary-btn" type="submit">Upload</button>
        </form>
        <div class="stacked-block">
          <div class="label-title">Uploaded attachments</div>
          <ul class="attachment-list">
            @foreach(($attachmentsByType['medical_report'] ?? []) as $file)
              <li><a href="{{ route('attachments.download', $file) }}">{{ $file->filename }}</a></li>
            @endforeach
          </ul>
        </div>
      </div>
      @endif
    </section>

    <section class="form-section">
      <h3>08. Details of Decorations / Medals Awarded to the Service Member</h3>
      <div class="decorations-table">
        <div class="decorations-head">Awarded Decorations</div>
        <div class="decorations-head">Awarded Times</div>
        <div class="decorations-head">Army Order No</div>
        @foreach($decorations as $idx => $item)
          <div class="decorations-cell">{{ $item['name'] }}</div>
          <div class="decorations-cell">
            <input name="formA[decorations][{{ $idx }}][times]" value="{{ $item['times'] ?? '' }}">
          </div>
          <div class="decorations-cell">
            <input name="formA[decorations][{{ $idx }}][order_no]" value="{{ $item['order_no'] ?? '' }}">
          </div>
          <input type="hidden" name="formA[decorations][{{ $idx }}][name]" value="{{ $item['name'] }}">
        @endforeach
      </div>
    </section>

    <section class="form-section">
      <h3>09. Sports Achievements</h3>
      <label>
        Details
        <textarea name="formA[sports_achievements]">{{ $fa['sports_achievements'] ?? '' }}</textarea>
      </label>
      <p class="muted" data-note="note_sports">Note: Certified copies of relevant sports certificates issued or endorsed by the authorized officer / sports authority must be attached.</p>
      @if($application)
      <div class="attachment-block">
        <form method="POST" enctype="multipart/form-data" action="{{ route('applications.attachments.upload', $application) }}" class="form-actions">
          @csrf
          <input type="hidden" name="type" value="sports_certificate">
          <label>
            Sports Certificate (PDF/JPG/PNG)
            <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png">
          </label>
          <button class="primary-btn" type="submit">Upload</button>
        </form>
        <div class="stacked-block">
          <div class="label-title">Uploaded attachments</div>
          <ul class="attachment-list">
            @foreach(($attachmentsByType['sports_certificate'] ?? []) as $file)
              <li><a href="{{ route('attachments.download', $file) }}">{{ $file->filename }}</a></li>
            @endforeach
          </ul>
        </div>
      </div>
      @endif
    </section>

    <section class="form-section">
      <h3>10. Applicant Declaration</h3>
      <div class="muted declaration-text">
        I hereby certify that my child is not currently receiving education at any government, private, or recognized school, and has not received such education previously. I further certify that the information stated above by me is true, and I am aware that if any information provided in this application is proven to be false for any reason, this application will be rendered null and void.

        Furthermore, I agree that if, even after admission to the school, any information stated in this application is proven to be false, my child will be removed from the said school and admitted to another school nominated by the Ministry of Education without any objection on my part.

        I also certify that, regardless of which school is granted from among the schools mentioned in the applications submitted by me, I will admit my child to that school, and that I have submitted an application under the normal admission procedure based on my permanent residence for the purpose of school admission.
      </div>
      <label class="option">
        <input type="checkbox" name="formA[applicant_declaration_confirmed]" value="1" {{ !empty($fa['applicant_declaration_confirmed']) ? 'checked' : '' }}>
        I confirm and agree to the declaration above.
      </label>
    </section>

    <div class="form-actions">
      <button class="ghost-btn" type="submit" name="action" value="draft">Save Draft</button>
      <button class="primary-btn" type="submit" name="action" value="submit">Submit Application</button>
    </div>
  </form>
</div>

<script>
  (function () {
    const I18N = {
      en: {
        title: "Grade 1 Admission Application",
        applicant_section: "01. Particulars of the Applicant (Service Person / Guardian)",
        child_section: "02. Particulars of the Child",
        service_status_section: "03. Service Status of the Applicant",
        special_info_section: "04. Special Information",
        schools_section: "05. Schools Applied For (In Order of Priority)",
        both_parents_section: "06. If both parents are serving in the Armed Forces, provide details of the other service person",
        casualty_section: "07. If the Father or Mother was Killed, Missing or Disabled while on Active Service, provide details",
        medals_section: "08. Details of Decorations / Medals Awarded to the Service Member",
        sports_section: "09. Sports Achievements",
        declaration_section: "10. Applicant Declaration",
        application_notice:
          "All applicants must submit their applications under the residential basis / past pupil basis / sibling basis. However, there are instances where, after such submission, principals refuse even to subject applicants to interviews and instead instruct them to submit applications through military channels. In such situations, the matter should be reported in writing to the Welfare Directorate immediately.",
        applicant_note:
          "A father or mother who served in active operational duty for a longer period of time.",
        child_note: "A certified photocopy of the birth certificate should be attached.",
        note_service_certificate:
          "Note: A service certificate issued by the relevant Commanding / Authorizing Officer must be attached. If such certification is not submitted, marks/priority for this category will not be considered.",
        note_disability:
          "Note: attach copy of the medical report obtained after 01 January of the year preceding the year of admission must be certified by the Army Hospital, Colombo, and submitted.",
        note_sports:
          "Note: Certified copies of relevant sports certificates issued or endorsed by the authorized officer / sports authority must be attached.",
        academic_year: "Academic Year",
        full_name_caps: "Full Name (IN CAPITAL LETTERS)",
        name_initials: "Name with Initials",
        nic: "National Identity Card (NIC) No",
        dob: "Date of Birth",
        regiment: "Regiment",
        unit: "Unit",
        service_no: "Service Number / Force Number",
        prev_service_no: "Previous Service Number (if any)",
        rank: "Rank / Designation",
        enlistment_date: "Date of Enlistment / Appointment",
        present_workplace: "Present Place of Work / Service Station",
        permanent_address: "Permanent Address",
        contact_number: "Contact Number",
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
        service_status: "Service Status",
        is_twin: "Is the child a twin?",
        special_needs: "Special educational needs?",
        sports_talents: "Sports / Special Talents (if any)",
        search: "Search",
        search_placeholder: "Search by census number or school name",
        add: "Add",
        selected_schools: "Selected Schools (Priority Order)",
        not_selected: "Not selected",
        remove: "Remove",
        service_number_simple: "Service Number",
        unit_regiment: "Unit / Regiment",
        other_parent_name_initials: "Name with Initials",
        other_parent_enlistment_date: "Date of Enlistment",
        other_parent_nic: "National Identity Card (NIC) No.",
        casualty_date: "Date of Death / Missing",
        casualty_place: "Place of Death / Missing",
        disability_date: "Disability Date",
        disability_place: "Disability Place",
        disability_percentage: "Percentage of Disability",
        disability_on_active: "Whether the disability occurred while on active service",
        disability_nature: "Nature / Type of Disability",
        disability_retired_date: "If retired due to disability, date of retirement",
        decorations_award: "Awarded Decorations",
        decorations_times: "Awarded Times",
        decorations_order: "Army Order No",
        details: "Details",
        declaration_text:
          "I hereby certify that my child is not currently receiving education at any government, private, or recognized school, and has not received such education previously. I further certify that the information stated above by me is true, and I am aware that if any information provided in this application is proven to be false for any reason, this application will be rendered null and void.\\n\\nFurthermore, I agree that if, even after admission to the school, any information stated in this application is proven to be false, my child will be removed from the said school and admitted to another school nominated by the Ministry of Education without any objection on my part.\\n\\nI also certify that, regardless of which school is granted from among the schools mentioned in the applications submitted by me, I will admit my child to that school, and that I have submitted an application under the normal admission procedure based on my permanent residence for the purpose of school admission.",
        declaration_agree: "I confirm and agree to the declaration above.",
        save_draft: "Save Draft",
        submit_application: "Submit Application",
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
        yes: "Yes",
        no: "No",
        status_current: "Currently in active service",
        status_disabled: "Disabled while on active duty",
        status_deceased: "Deceased while on active duty",
        status_retired: "Retired from service"
      },
      si: {
        title: "1 ශ්‍රේණි ප්‍රවේශ අයදුම්පත්",
        applicant_section: "01. අයදුම්කරුවගේ (සේවා පුද්ගලයා / භාරකරු) විස්තර",
        child_section: "02. දරුවාගේ විස්තර",
        service_status_section: "03. අයදුම්කරුවගේ සේවා තත්ත්වය",
        special_info_section: "04. විශේෂ තොරතුරු",
        schools_section: "05. ඉල්ලුම් කරන පාසල් (ප්‍රමුඛතාව අනුපිළිවෙළ)",
        both_parents_section: "06. දෙමව්පියන් දෙදෙනාම සන්නද්ධ හමුදාවල සේවය කරනේ නම් අනෙක් සේවා පුද්ගලයාගේ විස්තර",
        casualty_section: "07. පියා හෝ මව සක්‍රීය සේවයේදී මියගිය / අතුරුදහන් / අබාධිත වී නම් විස්තර",
        medals_section: "08. සේවකයාට පිරිනමන ලද සම්මාන / පදක්කම් විස්තර",
        sports_section: "09. ක්‍රීඩා ජයග්‍රහණ",
        declaration_section: "10. අයදුම්කරුගේ ප්‍රකාශනය",
        application_notice:
          "සියලුම අයදුම්කරුවන් ගෘහ මූලික පදනම / ආධි ශිෂ්‍ය පදනම / සහෝදර පදනම මත අයදුම්පත් ඉදිරිපත් කළ යුතු අතර, එසේ ඉදිරිපත් කළ පසු විදුහල්පතිවරුන් විසින් හමුදා ක්‍රමය මඟින් ඉල්ලුම්පත් ඉදිරිපත් කරන ලෙස දන්වා සම්මුඛ පරීක්ෂණයට භාජනය කිරීම පවා ප්‍රතික්ෂේප කරන අවස්ථා ඇති බැවින්, එසේ වූහොත් ඒ බව සුබසාධක අධ්‍යක්ෂ මණ්ඩලයට ලිඛිතව එම අවස්ථාවේදීම දැනුම් දීමට කටයුතු කළ යුතුය.",
        applicant_note: "වැඩි කාලසීමාවක් ක්‍රියාන්විත සේවයේ යෙදී සිටි පියා හෝ මව.",
        child_note: "උපස්තොපන සහතිකයේ සහතික කරණ ලද ප්‍රතිපිටපතක් අමුණිය යුතුය.",
        note_service_certificate:
          "සටහන: අදාල අධිකාරී විසින් නිකුත් කරන සේවා සහතිකයක් අමුණා තිබිය යුතුය. එවැනි සහතිකයක් ඉදිරිපත් නොකළහොත් මෙම කාණ්ඩයට අදාල ලකුණු/ප්‍රමුඛතාව සලකා නොගැනේ.",
        note_disability:
          "සටහන: අයදුම් වසරට පෙර වසරේ ජනවාරි 01 න් පසු ලබාගත් වෛද්‍ය වාර්තාවක් Army Hospital Colombo විසින් සහතික කර ඉදිරිපත් කළ යුතුය.",
        note_sports: "සටහන: අදාල ක්‍රීඩා සහතික වල සහතිකිත පිටපත් අමුණිය යුතුය.",
        academic_year: "ආධ්‍යයන වර්ෂය",
        full_name_caps: "සම්පූර්ණ නම (ලොකු අකුරින්)",
        name_initials: "මුල් අකුරු සමඟ නම",
        nic: "ජාතික හැඳුනුම්පත් අංකය",
        dob: "උපන් දිනය",
        regiment: "පෙල/රෙජිමේන්තුව",
        unit: "ඒකකය",
        service_no: "සේවා අංකය / බලකා අංකය",
        prev_service_no: "පෙර සේවා අංකය (තිබේ නම්)",
        rank: "පදවිය / තනතුර",
        enlistment_date: "සේවයට බැඳුණු දිනය / පත්වීමේ දිනය",
        present_workplace: "දැනට සේවය කරන ස්ථානය",
        permanent_address: "ස්ථිර ලිපිනය",
        contact_number: "දුරකථන අංකය",
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
        gn_division: "ග්‍රාම නිලධාරී වසම",
        district: "දිස්ත්‍රික්කය",
        province: "පළාත",
        service_status: "සේවා තත්ත්වය",
        is_twin: "දරුවා දෙදරු දරුවෙක්ද?",
        special_needs: "විශේෂ අධ්‍යාපන අවශ්‍යතා තිබේද?",
        sports_talents: "ක්‍රීඩා / විශේෂ දක්ෂතා (තිබේ නම්)",
        search: "සෙවීම",
        search_placeholder: "සෙන්සස් අංකය හෝ පාසල් නමින් සොයන්න",
        add: "එකතු කරන්න",
        selected_schools: "තෝරාගත් පාසල් (ප්‍රමුඛතාව අනුව)",
        not_selected: "තෝරා නැත",
        remove: "ඉවත් කරන්න",
        service_number_simple: "සේවා අංකය",
        unit_regiment: "ඒකකය / රෙජිමේන්තුව",
        other_parent_name_initials: "මුල් අකුරු සමඟ නම",
        other_parent_enlistment_date: "සේවයට බැඳුණු දිනය",
        other_parent_nic: "ජාතික හැඳුනුම්පත් අංකය",
        casualty_date: "මරණය / අතුරුදහන් වූ දිනය",
        casualty_place: "මරණය / අතුරුදහන් වූ ස්ථානය",
        disability_date: "අබාධිත වූ දිනය",
        disability_place: "අබාධිත වූ ස්ථානය",
        disability_percentage: "අබාධිත ප්‍රතිශතය",
        disability_on_active: "සක්‍රීය සේවයේදී අබාධිත වීම ද?",
        disability_nature: "අබාධයේ ස්වභාවය",
        disability_retired_date: "අබාධිත වීම හේතුවෙන් විශ්‍රාම ගියේ නම් දිනය",
        decorations_award: "පිරිනමන ලද සම්මාන",
        decorations_times: "ලැබූ වාර ගණන",
        decorations_order: "Army Order No",
        details: "විස්තර",
        declaration_text: "මෙම අයදුම්පතේ සඳහන් සියලු තොරතුරු සත්‍ය බව සහතික කරමි.",
        declaration_agree: "මම ඉහත ප්‍රකාශනයට එකඟ වෙමි.",
        save_draft: "කෙටුම්පත සුරකින්න",
        submit_application: "අයදුම්පත යවන්න",
        male: "පුරුෂ",
        female: "ස්ත්‍රී",
        buddhist: "බෞද්ධ",
        hindu: "හින්දු",
        islam: "ඉස්ලාම්",
        christian: "ක්‍රිස්තියානි",
        other: "වෙනත්",
        sinhala: "සිංහල",
        tamil: "දෙමළ",
        english: "ඉංග්‍රීසි",
        yes: "ඔව්",
        no: "නැත",
        status_current: "දැනට ක්‍රියාකාරී සේවයේ",
        status_disabled: "සක්‍රීය සේවයේදී අබාධිත",
        status_deceased: "සක්‍රීය සේවයේදී මියගිය",
        status_retired: "සේවයෙන් විශ්‍රාම"
      }
    };

    const langButtons = document.querySelectorAll('.lang-btn');
    const headingMap = new Map();
    document.querySelectorAll('h1, h3').forEach((node) => {
      headingMap.set(node, node.textContent.trim());
    });

    const labelByName = {
      'academic_year': 'academic_year',
      'formA[applicant_full_name_caps]': 'full_name_caps',
      'formA[applicant_name_initials]': 'name_initials',
      'formA[applicant_nic]': 'nic',
      'formA[applicant_dob]': 'dob',
      'formA[regiment_name]': 'regiment',
      'formA[unit_name]': 'unit',
      'formA[service_number]': 'service_no',
      'formA[previous_service_number]': 'prev_service_no',
      'formA[rank_designation]': 'rank',
      'formA[date_of_enlistment]': 'enlistment_date',
      'formA[present_workplace]': 'present_workplace',
      'formA[permanent_address]': 'permanent_address',
      'formA[contact_number]': 'contact_number',
      'formA[child_full_name_caps]': 'child_full_name_caps',
      'formA[child_name_initials]': 'child_name_initials',
      'formA[child_dob]': 'child_dob',
      'formA[child_age_years]': 'child_age_years',
      'formA[child_age_months]': 'child_age_months',
      'formA[child_age_days]': 'child_age_days',
      'formA[present_school]': 'present_school',
      'formA[child_address]': 'child_address',
      'formA[child_gn_division]': 'gn_division',
      'formA[child_district]': 'district',
      'formA[child_province]': 'province',
      'formA[special_talents]': 'sports_talents',
      'formA[other_parent_service_no]': 'service_number_simple',
      'formA[other_parent_rank]': 'rank',
      'formA[other_parent_unit]': 'unit_regiment',
      'formA[other_parent_name_initials]': 'other_parent_name_initials',
      'formA[other_parent_enlistment_date]': 'other_parent_enlistment_date',
      'formA[other_parent_nic]': 'other_parent_nic',
      'formA[casualty_date]': 'casualty_date',
      'formA[casualty_place]': 'casualty_place',
      'formA[disability_date]': 'disability_date',
      'formA[disability_place]': 'disability_place',
      'formA[disability_percentage]': 'disability_percentage',
      'formA[disability_nature]': 'disability_nature',
      'formA[disability_retired_date]': 'disability_retired_date'
    };

    function setLabelText(inputName, text) {
      const input = document.querySelector(`[name="${inputName}"]`);
      if (!input) return;
      const label = input.closest('label');
      if (!label) return;
      const textNode = Array.from(label.childNodes).find((n) => n.nodeType === 3);
      if (textNode) {
        textNode.textContent = ` ${text}`;
      } else {
        const span = document.createElement('span');
        span.textContent = text;
        label.insertBefore(span, label.firstChild);
      }
    }

    function setLang(lang) {
      const dict = I18N[lang] || I18N.en;
      document.querySelector('h1').textContent = dict.title;
      document.querySelectorAll('h3').forEach((node) => {
        const original = headingMap.get(node);
        if (!original) return;
        if (original.startsWith('01.')) node.textContent = dict.applicant_section;
        else if (original.startsWith('02.')) node.textContent = dict.child_section;
        else if (original.startsWith('03.')) node.textContent = dict.service_status_section;
        else if (original.startsWith('04.')) node.textContent = dict.special_info_section;
        else if (original.startsWith('05.')) node.textContent = dict.schools_section;
        else if (original.startsWith('06.')) node.textContent = dict.both_parents_section;
        else if (original.startsWith('07.')) node.textContent = dict.casualty_section;
        else if (original.startsWith('08.')) node.textContent = dict.medals_section;
        else if (original.startsWith('09.')) node.textContent = dict.sports_section;
        else if (original.startsWith('10.')) node.textContent = dict.declaration_section;
      });
      document.querySelectorAll('[data-note]').forEach((node) => {
        const key = node.getAttribute('data-note');
        if (dict[key]) node.textContent = dict[key];
      });
      Object.entries(labelByName).forEach(([name, key]) => {
        if (dict[key]) setLabelText(name, dict[key]);
      });
      document.querySelectorAll('.label-title').forEach((node) => {
        const text = node.textContent.trim();
        if (text === 'Gender') node.textContent = dict.gender;
        if (text === 'Religion') node.textContent = dict.religion;
        if (text === 'Medium of Instruction') node.textContent = dict.medium;
        if (text === 'Is the child a twin?') node.textContent = dict.is_twin;
        if (text === 'Special educational needs?') node.textContent = dict.special_needs;
        if (text === 'Whether the disability occurred while on active service') node.textContent = dict.disability_on_active;
      });
      document.querySelectorAll('.school-search-label').forEach((label) => {
        const input = label.querySelector('input');
        if (input && dict.search_placeholder) input.setAttribute('placeholder', dict.search_placeholder);
        if (label.firstChild && label.firstChild.nodeType === 3) {
          label.firstChild.textContent = ` ${dict.search}`;
        }
      });
      document.querySelectorAll('.school-header').forEach((node) => {
        node.textContent = dict.selected_schools;
      });
      document.querySelectorAll('[data-selected-text]').forEach((node) => {
        if (!node.textContent.trim() || node.textContent.includes('Not selected')) {
          node.textContent = dict.not_selected;
        }
      });
      const addBtn = document.getElementById('school-apply');
      if (addBtn) addBtn.textContent = dict.add;
      document.querySelectorAll('[data-clear-school]').forEach((btn) => {
        btn.textContent = dict.remove;
      });
      const draftBtn = document.querySelector('button[name="action"][value="draft"]');
      const submitBtn = document.querySelector('button[name="action"][value="submit"]');
      if (draftBtn) draftBtn.textContent = dict.save_draft;
      if (submitBtn) submitBtn.textContent = dict.submit_application;
      document.querySelectorAll('.option span').forEach((node) => {
        const t = node.textContent.trim();
        if (t === 'Male') node.textContent = dict.male;
        if (t === 'Female') node.textContent = dict.female;
        if (t === 'Buddhist') node.textContent = dict.buddhist;
        if (t === 'Hindu') node.textContent = dict.hindu;
        if (t === 'Islam') node.textContent = dict.islam;
        if (t === 'Christian') node.textContent = dict.christian;
        if (t === 'Other') node.textContent = dict.other;
        if (t === 'Sinhala') node.textContent = dict.sinhala;
        if (t === 'Tamil') node.textContent = dict.tamil;
        if (t === 'English') node.textContent = dict.english;
        if (t === 'Yes') node.textContent = dict.yes;
        if (t === 'No') node.textContent = dict.no;
      });
      document.querySelectorAll('.decorations-head').forEach((node) => {
        const t = node.textContent.trim();
        if (t === 'Awarded Decorations') node.textContent = dict.decorations_award;
        if (t === 'Awarded Times') node.textContent = dict.decorations_times;
        if (t === 'Army Order No') node.textContent = dict.decorations_order;
      });
      const declaration = document.querySelector('.declaration-text');
      if (declaration) declaration.textContent = dict.declaration_text;
      const agree = document.querySelector('.declaration-text')?.nextElementSibling?.querySelector('span');
      if (agree) agree.textContent = dict.declaration_agree;
      langButtons.forEach((btn) => btn.classList.toggle('active', btn.getAttribute('data-lang') === lang));
      localStorage.setItem('form.lang', lang);
    }

    const savedLang = localStorage.getItem('form.lang') || 'en';
    setLang(savedLang);
    langButtons.forEach((btn) => btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang'))));

    const search = document.querySelector('.school-search');
    const results = document.getElementById('school-options');
    const applyBtn = document.getElementById('school-apply');
    if (!search || !results || !applyBtn) return;

    let lastQuery = '';

    async function fetchSchools(q) {
      const url = '/schools?q=' + encodeURIComponent(q || '');
      const res = await fetch(url);
      if (!res.ok) return [];
      return await res.json();
    }

      function renderOptions(items) {
        results.innerHTML = '';
        items.forEach((item) => {
          const opt = document.createElement('option');
          opt.value = item.census_no ? item.census_no + ' - ' + item.name : item.name;
          results.appendChild(opt);
        });
      }

    search.addEventListener('input', async () => {
      const q = search.value.trim();
      if (q.length < 2) {
        renderOptions([]);
        return;
      }
      lastQuery = q;
      const items = await fetchSchools(q);
      if (lastQuery !== q) return;
      renderOptions(items);
    });

      function resolveSelection(value) {
        if (!value) return null;
        const parts = value.split(' - ');
        if (parts.length >= 2) {
          return { census_no: parts[0].trim(), name: parts.slice(1).join(' - ').trim() };
        }
        return { census_no: '', name: value.trim() };
      }

      applyBtn.addEventListener('click', () => {
        const selection = resolveSelection(search.value.trim());
        if (!selection) return;
        const censusInputs = Array.from(document.querySelectorAll('[data-school-census]'));
        const nameInputs = Array.from(document.querySelectorAll('[data-school-name]'));
        const labelNodes = Array.from(document.querySelectorAll('[data-selected-text]'));
        let idx = censusInputs.findIndex((el) => !el.value);
        if (idx < 0) idx = 0;
        if (censusInputs[idx]) censusInputs[idx].value = selection.census_no;
        if (nameInputs[idx]) nameInputs[idx].value = selection.name;
        if (labelNodes[idx]) {
          labelNodes[idx].textContent = selection.census_no
            ? `${selection.census_no} - ${selection.name}`
            : selection.name;
        }
        search.value = '';
      });

    document.querySelectorAll('[data-clear-school]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-clear-school');
        const census = document.querySelector('[data-school-census="' + idx + '"]');
        const name = document.querySelector('[data-school-name="' + idx + '"]');
        const label = document.querySelector('[data-selected-text="' + idx + '"]');
        if (census) census.value = '';
        if (name) name.value = '';
        if (label) label.textContent = 'Not selected';
      });
    });
  })();
</script>
@endsection
