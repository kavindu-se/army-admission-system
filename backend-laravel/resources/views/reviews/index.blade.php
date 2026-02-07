@extends('layouts.app')

@section('content')
@php
  $selected = $apps->firstWhere('id', request('id')) ?? $apps->first();
  $statuses = array_values(config('army.statuses'));
  $stages = array_values(config('army.stages'));
@endphp

<div class="dashboard-shell">
  @include('partials.sidebar')

  <section class="dashboard-main">
    <div class="review-layout">
      <div>
        <h2>Review Queue</h2>
        <div class="queue-list">
          @forelse($apps as $app)
            <a class="queue-item {{ $selected && $selected->id === $app->id ? 'active' : '' }}" href="{{ route('review.index', ['id' => $app->id]) }}">
              <div class="queue-item-title">{{ $app->application_no }}</div>
              <div class="queue-item-meta">
                <span class="queue-item-status">{{ $app->status }}</span>
                <span class="stage-chip">{{ $app->current_stage }}</span>
              </div>
            </a>
          @empty
            <div class="card">No applications in queue.</div>
          @endforelse
        </div>
      </div>

      <div class="queue-detail">
        @if($selected)
          <h3>Application {{ $selected->application_no }}</h3>
          <div class="detail-card">
            <p class="muted">Applicant ID: {{ $selected->applicant_id }}</p>
            <p class="muted">Academic Year: {{ $selected->academic_year }}</p>
          </div>

          <form method="POST" action="{{ route('review.update', $selected) }}" class="form-grid">
            @csrf
            @method('PUT')
            <label>
              Status
              <select name="status">
                @foreach($statuses as $status)
                  <option value="{{ $status }}" {{ $selected->status === $status ? 'selected' : '' }}>{{ $status }}</option>
                @endforeach
              </select>
            </label>
            <label>
              Current Stage
              <select name="current_stage">
                @foreach($stages as $stage)
                  <option value="{{ $stage }}" {{ $selected->current_stage === $stage ? 'selected' : '' }}>{{ $stage }}</option>
                @endforeach
              </select>
            </label>
            <div class="form-actions">
              <button class="primary-btn" type="submit">Update Status</button>
            </div>
          </form>
        @else
          <p class="muted">Select an application to review.</p>
        @endif
      </div>
    </div>
  </section>
</div>
@endsection
