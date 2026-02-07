@extends('layouts.app')

@section('content')
@php
  $user = auth()->user();
  $displayName = $user?->name ?? 'Applicant';
  $roleLabel = 'Reviewer';
  if (in_array('Admin', $roles, true)) $roleLabel = 'Admin';
  elseif (in_array('RHQAdmin', $roles, true)) $roleLabel = 'RHQ Admin';
  elseif (in_array('Applicant', $roles, true)) $roleLabel = 'Applicant';
  elseif (count($roles) > 0) $roleLabel = $roles[0];

  $formatStatus = function ($status) {
    if (!$status) return '-';
    return strtoupper(str_replace('_', ' ', $status));
  };

  $reviewerData = [
    'inbox' => $apps,
    'approved' => $apps->filter(fn ($app) => $app->status === 'dte_approved'),
    'rejected' => $apps->filter(fn ($app) => $app->status === 'rejected'),
  ];
  $reviewerData['in_progress'] = $apps->filter(fn ($app) => $app->status !== 'dte_approved' && $app->status !== 'rejected');

  $reviewerCounts = [
    'inbox' => $reviewerData['inbox']->count(),
    'in_progress' => $reviewerData['in_progress']->count(),
    'approved' => $reviewerData['approved']->count(),
    'rejected' => $reviewerData['rejected']->count(),
  ];
@endphp

<div class="dashboard-shell">
  <aside class="dashboard-sidebar">
    <div class="profile-card">
      <img class="profile-avatar" src="/assets/Sri_Lanka_Army_Logo.png" alt="Applicant Photo">
      <div>
        <div class="profile-name">{{ $displayName }}</div>
        <div class="profile-role">{{ $roleLabel }}</div>
      </div>
    </div>
    @if($isApplicant)
      <a class="primary-btn full-btn" href="{{ route('applications.create') }}">New Application</a>
    @endif
    <nav class="side-menu">
      @if($isApplicant)
        <button type="button" class="side-link" data-panel-target="applications">My Applications</button>
        <button type="button" class="side-link" data-panel-target="notices">Notices</button>
      @else
        <button type="button" class="side-link" data-review-panel="inbox">Inbox</button>
        <button type="button" class="side-link" data-review-panel="in_progress">On Progress</button>
        <button type="button" class="side-link" data-review-panel="approved">Approved</button>
        <button type="button" class="side-link" data-review-panel="rejected">Rejected</button>
      @endif
      @if($isAdmin)
        <a class="side-link" href="{{ route('admin.index') }}">Admin Panel</a>
      @endif
    </nav>
  </aside>

  <main class="dashboard-main">
    <div class="page-header">
      <h2>Welcome, {{ $displayName }}</h2>
    </div>

    @if($isApplicant)
      <section class="panel" data-panel="applications">
        <div class="card-grid">
          @foreach($apps as $app)
            @php
              $formA = $app->form_a_json ?? [];
              $attachments = $attachmentsByApp[$app->id] ?? collect();
              $canDelete = in_array($app->current_stage, ['Applicant', 'UnitSubjectClerk'], true);
            @endphp
            <div class="card">
              <h3>{{ $formA['applicant_name_initials'] ?? $formA['applicant_full_name_caps'] ?? 'Applicant' }}</h3>
              <p>Status: {{ $formatStatus($app->status) }}</p>
              <p>Stage: {{ $app->current_stage }}</p>
              <div class="muted attachment-block">
                <button type="button" class="ghost-btn" data-attachment-toggle="{{ $app->id }}">Show attachments</button>
                <div class="attachment-panel" data-attachment-panel="{{ $app->id }}" style="display:none;">
                  @if($attachments->count() === 0)
                    <div>No attachments.</div>
                  @else
                    <ul class="attachment-list">
                      @foreach($attachments as $file)
                        <li>
                          <a href="{{ route('attachments.download', $file) }}" target="_blank" rel="noreferrer">{{ $file->filename }}</a>
                        </li>
                      @endforeach
                    </ul>
                  @endif
                </div>
              </div>
              <div class="action-group">
                <a class="ghost-btn" href="{{ route('applications.edit', $app) }}">
                  {{ $app->status === 'draft' ? 'Continue Draft' : 'View Application' }}
                </a>
                @if($canDelete)
                  <form method="POST" action="{{ route('applications.destroy', $app) }}">
                    @csrf
                    @method('DELETE')
                    <button class="danger-btn" type="submit">Delete Application</button>
                  </form>
                @endif
              </div>
            </div>
          @endforeach
          @if($apps->count() === 0)
            <div class="card muted">No applications yet.</div>
          @endif
        </div>
      </section>

      <section class="panel" data-panel="notices" style="display:none;">
        <div class="card notice-panel">
          <div class="notice-header">
            <h3 class="notice-title">General Instructions for Submission of Applications</h3>
            <div class="lang-toggle">
              <button type="button" class="lang-btn" data-lang="si">සිං</button>
              <button type="button" class="lang-btn" data-lang="en" onclick="setNoticeLang(''en'')">EN</button>
            </div>
          </div>
          <div class="form-actions">
            <a class="ghost-btn notice-download-btn" href="{{ route('notice.download') }}">Download Notice PDF</a>
          </div>
          <ol class="notice-alert-list" data-lang-body="en" style="display:none;">
            <li>Only one application form shall be completed for one child. The original application form and three (03) certified copies shall be submitted to the relevant Division/Zone, and one copy shall be retained by the applicant. A father or mother who served in active operational duty for a longer period of time.</li>
            <li>The application form must be submitted together with the child’s Birth Certificate. In addition, any other documents requested by the relevant Selection / Interview Board shall also be submitted.</li>
            <li>Applications may be submitted for a maximum of ten (10) schools, in accordance with the prescribed order of preference.</li>
            <li>The schools applied for must be Government schools or schools that conduct primary grades.</li>
            <li>Based on the minimum marks obtained for selection of students in the previous year, applicants are advised to select ten (10) schools with a reasonable possibility of admission.</li>
            <li>Colombo and Kurunegala Defence Services Colleges shall not be included among the ten (10) selected schools.</li>
            <li>When applying to schools selected on a religious basis, due consideration shall be given to the eligibility of the child for admission to the relevant school in accordance with the child’s religion.</li>
            <li>When submitting applications in respect of twin children, consideration shall be given to the possibility of admitting both children to the same school, depending on the number of vacancies available in that school.</li>
            <li>In the event of any discrepancy between the name of a school and its serial number, priority shall be given to the serial number assigned to the school.</li>
            <li>The provisional marks list shall be published in the month of July, and the provisional list of selected schools shall be published in the month of October, on the official website of the Ministry of Defence and other relevant official websites.</li>
            <li>If any applicant is not satisfied with the marks or the school allotted, based on the published provisional marks list or provisional school list, appeals may be submitted within the stipulated time period.</li>
          </ol>
          <ol class="notice-alert-list" data-lang-body="si">
            <li>එක් දරුවෙකු සඳහා එක් අයදුම්පත්‍රයක් පමණක් සම්පූර්ණ කළ යුතුය. සම්පූර්ණ කරණ ලද අයදුම්පත්‍රයේ මුල් පිටපත සහ සහතික පිටපත් 3ක් අදාල කොට්ඨාසය වෙත භාරදිය යුතු අතර, එක් පිටපතක් තමන් ළඟ තබා ගත යුතුය. වැඩි කාලසීමාවක් ක්‍රියාන්විත සේවයේ යෙදී සිටි පියා හෝ මව.</li>
            <li>අයදුම්පත්‍රය සමඟ දරුවාගේ උපස්තොපන සහතිකය ඉදිරිපත් කළ යුතුය. ඊට අමතරව, අදාල භූමිකාවට අදාලව අධ්‍යක්ෂ මණ්ඩලය විසින් ඉල්ලා සිටින අනෙකුත් ලේඛනයන් ද ඉදිරිපත් කළ යුතුය.</li>
            <li>මෙම ක්‍රමවේදය අනුව පාසල් 10ක් දක්වා අයදුම් කළ හැක.</li>
            <li>අයදුම් කරන පාසල් රජයේ පාසල් හෝ ප්‍රාථමික ශ්‍රේණි පවත්වාගෙන යන පාසල් විය යුතුය.</li>
            <li>පසුගිය වර්ෂයේ දරුවන් තෝරාගත් අඩුම ලකුණු ප්‍රමාණය අනුව සම්භාවිතාවක් ඇති පාසල් 10ක් තෝරා ගැනීම සුදුසු වේ.</li>
            <li>කොළඹ සහ කුරුණෑගල ආරක්ෂක සේවා විද්‍යාල මෙම පාසල් 10 තුළට ඇතුළත් නොකළ යුතුය.</li>
            <li>ආගමික පදනම මත පාසල් තෝරාගැනීමේදී, දරුවාගේ ආගම අනුව එම පාසලට ඇතුළත් වීමට හැකියාව පිළිබඳ සලකා බැලිය යුතුය.</li>
            <li>නිවුන් දරුවන් සම්බන්ධ අයදුම්පත් ඉදිරිපත් කිරීමෙදී, දරුවන් දෙදෙනාම එකම පාසලකට ඇතුළත් වීමට හැකියාව සලකා බැලිය යුතුය.</li>
            <li>පාසලේ නම සහ අනුක්‍රමික අංකය අතර පරස්පරතාවයක් පවතින්නේ නම්, පාසලට හිමි අනුක්‍රමික අංකය අනුව ප්‍රමුඛතාවය ලබා දෙනු ලැබේ.</li>
            <li>තාවකාලික ලකුණු ලේඛනය ජූලි මාසය තුළද, තාවකාලික පාසල් ලේඛනය ඔක්තෝබර් මාසය තුළද, ආරක්ෂක අමාත්‍යාංශයේ නිල වෙබ් අඩවිය සහ අදාල වෙබ් අඩවිවල ප්‍රසිද්ධ කරන ලැබේ.</li>
            <li>ප්‍රසිද්ධ කරණ ලද තාවකාලික ලකුණු ලේඛනය හෝ පාසල් ලේඛනය අනුව ලබාදී ඇති ලකුණු හෝ පාසල් පිළිබඳ සෑහීමකට පත් නොවන්නේ නම්, අදාල කාල සීමාව තුළ අභියාචනා ඉදිරිපත් කළ හැක.</li>
          </ol>
        </div>
      </section>
    @else
      <section class="panel" data-panel="reviewer">
        <div class="card">
          <div class="page-header">
            <h3>Approval Queue</h3>
            <div class="tab-toggle">
              <button type="button" class="tab-btn" data-review-panel="inbox">INBOX <span class="tab-badge">{{ $reviewerCounts['inbox'] }}</span></button>
              <button type="button" class="tab-btn" data-review-panel="in_progress">ON PROGRESS <span class="tab-badge">{{ $reviewerCounts['in_progress'] }}</span></button>
              <button type="button" class="tab-btn" data-review-panel="approved">APPROVED <span class="tab-badge">{{ $reviewerCounts['approved'] }}</span></button>
              <button type="button" class="tab-btn" data-review-panel="rejected">REJECTED <span class="tab-badge">{{ $reviewerCounts['rejected'] }}</span></button>
            </div>
          </div>
          <div class="table-scroll">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Service No</th>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Regiment</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @foreach($reviewerData['inbox'] as $app)
                  @php
                    $formA = $app->form_a_json ?? [];
                    $serviceNo = $formA['service_number'] ?? '-';
                    $rank = $formA['rank_designation'] ?? '-';
                    $regiment = $app->regiment_name ?? $formA['regiment_name'] ?? '-';
                    $unit = $app->unit_no ?? $formA['unit_name'] ?? '-';
                    $name = $formA['applicant_name_initials'] ?? $formA['applicant_full_name_caps'] ?? 'Applicant';
                  @endphp
                  <tr data-review-row="inbox">
                    <td>{{ $serviceNo }}</td>
                    <td>{{ $rank }}</td>
                    <td>{{ $name }}</td>
                    <td>{{ $regiment }}</td>
                    <td>{{ $unit }}</td>
                    <td>{{ $formatStatus($app->status) }}</td>
                    <td>
                      <a class="ghost-btn" href="{{ route('review.show', $app) }}">View</a>
                    </td>
                  </tr>
                @endforeach
                @foreach($reviewerData['in_progress'] as $app)
                  @php
                    $formA = $app->form_a_json ?? [];
                    $serviceNo = $formA['service_number'] ?? '-';
                    $rank = $formA['rank_designation'] ?? '-';
                    $regiment = $app->regiment_name ?? $formA['regiment_name'] ?? '-';
                    $unit = $app->unit_no ?? $formA['unit_name'] ?? '-';
                    $name = $formA['applicant_name_initials'] ?? $formA['applicant_full_name_caps'] ?? 'Applicant';
                  @endphp
                  <tr data-review-row="in_progress">
                    <td>{{ $serviceNo }}</td>
                    <td>{{ $rank }}</td>
                    <td>{{ $name }}</td>
                    <td>{{ $regiment }}</td>
                    <td>{{ $unit }}</td>
                    <td>{{ $formatStatus($app->status) }}</td>
                    <td>
                      <a class="ghost-btn" href="{{ route('review.show', $app) }}">View</a>
                    </td>
                  </tr>
                @endforeach
                @foreach($reviewerData['approved'] as $app)
                  @php
                    $formA = $app->form_a_json ?? [];
                    $serviceNo = $formA['service_number'] ?? '-';
                    $rank = $formA['rank_designation'] ?? '-';
                    $regiment = $app->regiment_name ?? $formA['regiment_name'] ?? '-';
                    $unit = $app->unit_no ?? $formA['unit_name'] ?? '-';
                    $name = $formA['applicant_name_initials'] ?? $formA['applicant_full_name_caps'] ?? 'Applicant';
                  @endphp
                  <tr data-review-row="approved">
                    <td>{{ $serviceNo }}</td>
                    <td>{{ $rank }}</td>
                    <td>{{ $name }}</td>
                    <td>{{ $regiment }}</td>
                    <td>{{ $unit }}</td>
                    <td>{{ $formatStatus($app->status) }}</td>
                    <td>
                      <a class="ghost-btn" href="{{ route('review.show', $app) }}">View</a>
                    </td>
                  </tr>
                @endforeach
                @foreach($reviewerData['rejected'] as $app)
                  @php
                    $formA = $app->form_a_json ?? [];
                    $serviceNo = $formA['service_number'] ?? '-';
                    $rank = $formA['rank_designation'] ?? '-';
                    $regiment = $app->regiment_name ?? $formA['regiment_name'] ?? '-';
                    $unit = $app->unit_no ?? $formA['unit_name'] ?? '-';
                    $name = $formA['applicant_name_initials'] ?? $formA['applicant_full_name_caps'] ?? 'Applicant';
                  @endphp
                  <tr data-review-row="rejected">
                    <td>{{ $serviceNo }}</td>
                    <td>{{ $rank }}</td>
                    <td>{{ $name }}</td>
                    <td>{{ $regiment }}</td>
                    <td>{{ $unit }}</td>
                    <td>{{ $formatStatus($app->status) }}</td>
                    <td>
                      <a class="ghost-btn" href="{{ route('review.show', $app) }}">View</a>
                    </td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          </div>
        </div>
      </section>
    @endif
  </main>
</div>

<script>
  (function () {
    const isApplicant = {{ $isApplicant ? 'true' : 'false' }};
    const panelButtons = document.querySelectorAll('[data-panel-target]');
    const panels = document.querySelectorAll('[data-panel]');

    function setPanel(panel) {
      panels.forEach((el) => {
        el.style.display = el.getAttribute('data-panel') === panel ? '' : 'none';
      });
      panelButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-panel-target') === panel);
      });
      localStorage.setItem('dashboard.panel', panel);
    }

    if (panelButtons.length) {
      const defaultPanel = isApplicant ? 'applications' : 'reviewer';
      const saved = localStorage.getItem('dashboard.panel') || defaultPanel;
      setPanel(saved);
      panelButtons.forEach((btn) => {
        btn.addEventListener('click', () => setPanel(btn.getAttribute('data-panel-target')));
      });
    }

    document.querySelectorAll('[data-attachment-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-attachment-toggle');
        const panel = document.querySelector(`[data-attachment-panel="${id}"]`);
        if (!panel) return;
        const show = panel.style.display === 'none';
        panel.style.display = show ? '' : 'none';
        btn.textContent = show ? 'Hide attachments' : 'Show attachments';
      });
    });

    const langButtons = document.querySelectorAll('.lang-btn');
    window.setNoticeLang = setLang;
    const langBodies = document.querySelectorAll('[data-lang-body]');
    function setLang(lang) {
      langBodies.forEach((body) => {
        body.style.display = body.getAttribute('data-lang-body') === lang ? '' : 'none';
      });
      langButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
      });
      localStorage.setItem('dashboard.noticeLang', lang);
    }
    if (langButtons.length) {
      const savedLang = localStorage.getItem('dashboard.noticeLang') || 'si';
      setLang(savedLang);
      langButtons.forEach((btn) => {
        btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
      });
    }

    const reviewTabs = document.querySelectorAll('[data-review-panel]');
    const reviewRows = document.querySelectorAll('[data-review-row]');
    function setReviewPanel(panel) {
      reviewRows.forEach((row) => {
        row.style.display = row.getAttribute('data-review-row') === panel ? '' : 'none';
      });
      reviewTabs.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-review-panel') === panel);
      });
      localStorage.setItem('dashboard.reviewPanel', panel);
    }
    if (reviewTabs.length) {
      const savedReview = localStorage.getItem('dashboard.reviewPanel') || 'inbox';
      setReviewPanel(savedReview);
      reviewTabs.forEach((btn) => {
        btn.addEventListener('click', () => setReviewPanel(btn.getAttribute('data-review-panel')));
      });
    }
  })();
</script>
@endsection





