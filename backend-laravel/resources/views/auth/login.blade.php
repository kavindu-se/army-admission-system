<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <div class="login-shell">
    <div class="login-left">
      <img class="login-crest" src="/assets/Sri_Lanka_Army_Logo.png" alt="Sri Lanka Army Crest">
      <h1 class="login-title">
        SCHOOL ADMISSION
        <span>MANAGEMENT SYSTEM</span>
      </h1>
      <h2 class="login-welcome">Welcome back</h2>
      <p class="login-sub">Sri Lanka Army Headquarters</p>
    </div>
    <div class="login-right">
      <div class="login-panel">
        <h3>Sign in</h3>
        @if ($errors->any())
          <div class="error">{{ $errors->first() }}</div>
        @endif
        <form method="POST" action="{{ route('login.post') }}" class="login-form">
          @csrf
          <label>
            Username or Email
            <input name="service_no" placeholder="100277898 or kavindu@gmail.com" required>
          </label>
          <label>
            Password
            <input type="password" name="password" required>
          </label>
          <button type="submit" class="login-btn">Sign in</button>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
