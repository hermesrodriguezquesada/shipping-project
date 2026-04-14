$ErrorActionPreference = 'Stop'

$endpoint = 'http://localhost:3001/graphql'

if (-not $env:ADMIN_SEED_EMAIL -or -not $env:ADMIN_SEED_PASSWORD) {
  $envFile = Join-Path $PSScriptRoot '..\\.env'
  if (Test-Path $envFile) {
    foreach ($line in Get-Content $envFile) {
      if ($line -match '^ADMIN_SEED_EMAIL=(.+)$' -and -not $env:ADMIN_SEED_EMAIL) {
        $env:ADMIN_SEED_EMAIL = $Matches[1].Trim()
      }
      if ($line -match '^ADMIN_SEED_PASSWORD=(.+)$' -and -not $env:ADMIN_SEED_PASSWORD) {
        $env:ADMIN_SEED_PASSWORD = $Matches[1].Trim()
      }
    }
  }
}

$loginBody = @{
  query = 'mutation($input: LoginInput!) { login(input:$input){ accessToken } }'
  variables = @{ input = @{ email = $env:ADMIN_SEED_EMAIL; password = $env:ADMIN_SEED_PASSWORD } }
} | ConvertTo-Json -Depth 8

$loginResp = Invoke-RestMethod -Uri $endpoint -Method Post -ContentType 'application/json' -Body $loginBody
$token = $loginResp.data.login.accessToken
if (-not $token) {
  throw 'No se obtuvo token admin para smoke test'
}

$headers = @{ Authorization = "Bearer $token" }

$caseA = @{ query = 'query { adminSettings { name type value isMasked } }' } | ConvertTo-Json -Depth 8
$respA = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -ContentType 'application/json' -Body $caseA

$caseB = @{
  query = 'query($name:String!){ adminSetting(name:$name){ name type value isMasked } }'
  variables = @{ name = 'CONTACT_WHATSAPP_CHANNEL' }
} | ConvertTo-Json -Depth 8
$respB = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -ContentType 'application/json' -Body $caseB

$caseC = @{
  query = 'mutation($input: AdminUpdateSystemSettingInput!){ adminUpdateSetting(input:$input){ name type value isMasked } }'
  variables = @{ input = @{ name = 'CONTACT_WHATSAPP_CHANNEL'; value = 'https://wa.me/backend-smoke' } }
} | ConvertTo-Json -Depth 8
$respC = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -ContentType 'application/json' -Body $caseC

$caseD = @{
  query = 'mutation($input: AdminUpdateSystemSettingInput!){ adminUpdateSetting(input:$input){ name type value isMasked } }'
  variables = @{ input = @{ name = 'REMITTANCE_ENABLED'; value = 'false' } }
} | ConvertTo-Json -Depth 8
$respD = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -ContentType 'application/json' -Body $caseD

$caseE = @{
  query = 'query($name:String!){ adminSetting(name:$name){ name type value isMasked } }'
  variables = @{ name = 'EXTERNAL_CHANNEL_SHARED_SECRET' }
} | ConvertTo-Json -Depth 8
$respE = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -ContentType 'application/json' -Body $caseE

$summary = [ordered]@{
  caseA_count = $respA.data.adminSettings.Count
  caseA_hasPasswordMasked = ($respA.data.adminSettings | Where-Object { $_.name -eq 'EXTERNAL_CHANNEL_SHARED_SECRET' } | Select-Object -First 1).isMasked
  caseB_setting = $respB.data.adminSetting
  caseC_updated = $respC.data.adminUpdateSetting
  caseD_updated = $respD.data.adminUpdateSetting
  caseE_passwordRead = $respE.data.adminSetting
}

$summary | ConvertTo-Json -Depth 8
