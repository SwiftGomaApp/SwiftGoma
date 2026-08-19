const fs = require('fs');
const path = require('path');

// Helper functions
function makeDescription(name, method, urlPath, auth, bodyExample, successCode, successBody, errors, notes) {
  const authRequired = auth ? 'Required' : 'Not Required';
  const headersTable = `| Header | Type | Required | Description |\n|--------|------|----------|-------------|\n| Content-Type | string | Yes | application/json |${auth ? '\n| Authorization | string | Yes | Bearer {{accessToken}} |' : ''}`;
  const bodySection = bodyExample ? '```json\n' + JSON.stringify(bodyExample, null, 2) + '\n```' : 'No request body required.';
  const successSection = '```json\n' + JSON.stringify(successBody || { success: true, data: {} }, null, 2) + '\n```';
  const errorRows = (errors || []).map(e => `| ${e[0]} | ${e[1]} | ${e[2]} |`).join('\n');
  const errorSection = errorRows ? `| Status | Code | Description |\n|--------|------|-------------|\n${errorRows}` : 'None';
  const notesSection = (notes || []).map(n => `- ${n}`).join('\n') || '- None';
  return `# ${name}\n\n## Description\n${name}\n\n## Endpoint\n**Method:** \`${method}\`\n**URL:** \`{{baseUrl}}/${urlPath}\`\n**Authentication:** \`${authRequired}\`\n\n## Request Headers\n${headersTable}\n\n## Request Body\n${bodySection}\n\n## Success Response\n**Status Code:** \`${successCode || '200 OK'}\`\n${successSection}\n\n## Error Responses\n${errorSection}\n\n## Notes\n${notesSection}`;
}

function bearerAuth() {
  return { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] };
}

function makeRequest(name, method, urlPath, opts = {}) {
  const { auth, body, description, headers, events, responses, query, formdata } = opts;
  const url = {
    raw: `{{baseUrl}}/${urlPath}`,
    host: ['{{baseUrl}}'],
    path: urlPath.split('/').filter(Boolean)
  };
  if (query) {
    url.query = query.map(q => ({ key: q.key, value: q.value, description: q.description || '' }));
  }
  const item = {
    name,
    request: {
      method: method.toUpperCase(),
      header: headers || [{ key: 'Content-Type', value: 'application/json' }],
      url
    },
    response: responses || []
  };
  if (auth) item.request.auth = bearerAuth();
  if (description) item.request.description = description;
  if (body && !formdata) {
    item.request.body = { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } };
  }
  if (formdata) {
    item.request.body = { mode: 'formdata', formdata };
    item.request.header = (headers || []).filter(h => h.key !== 'Content-Type');
  }
  if (events) item.event = events;
  return item;
}

function makeFolder(name, items) {
  return { name, item: items };
}

function testSaveTokens() {
  return [{ listen: 'test', script: { type: 'text/javascript', exec: [
    'if (pm.response.code === 200 || pm.response.code === 201) {',
    '    const res = pm.response.json();',
    '    if (res.data && res.data.accessToken) { pm.collectionVariables.set("accessToken", res.data.accessToken); }',
    '    if (res.data && res.data.refreshToken) { pm.collectionVariables.set("refreshToken", res.data.refreshToken); }',
    '    if (res.data && res.data.user && res.data.user.id) { pm.collectionVariables.set("userId", res.data.user.id); }',
    '}'
  ] } }];
}

function testSaveRefresh() {
  return [{ listen: 'test', script: { type: 'text/javascript', exec: [
    'if (pm.response.code === 200) {',
    '    const res = pm.response.json();',
    '    if (res.data && res.data.accessToken) { pm.collectionVariables.set("accessToken", res.data.accessToken); }',
    '}'
  ] } }];
}

function testSaveId(varName, path) {
  const p = path || 'id';
  return [{ listen: 'test', script: { type: 'text/javascript', exec: [
    'if (pm.response.code === 200 || pm.response.code === 201) {',
    '    const res = pm.response.json();',
    `    if (res.data && res.data.${p}) { pm.collectionVariables.set("${varName}", res.data.${p}); }`,
    '}'
  ] } }];
}

function successResp(name, code, body) {
  return { name, originalRequest: {}, status: code >= 400 ? 'Error' : 'OK', code, body: JSON.stringify(body, null, 2), header: [{ key: 'Content-Type', value: 'application/json' }] };
}

function makeResponses(successCode, successData, errors) {
  const r = [successResp('Success', successCode, { success: true, data: successData })];
  if (errors) {
    errors.forEach(e => {
      r.push(successResp(e[1], e[0], { success: false, error: { code: e[1], message: e[2], details: null, requestId: 'req_abc123' } }));
    });
  }
  return r;
}

const authErrors = [[401, 'UNAUTHORIZED', 'Invalid or expired token']];
const validationErrors = [[400, 'BAD_REQUEST', 'Validation failed']];
const notFoundErrors = [[404, 'NOT_FOUND', 'Resource not found']];

function desc(name, method, urlPath, auth, body, successCode, successBody, errors, notes) {
  return makeDescription(name, method, urlPath, auth, body, successCode, successBody, errors, notes);
}

// Build collection
const collection = {
  info: {
    name: 'SwiftGoma API',
    description: 'Complete API collection for SwiftGoma backend',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  auth: bearerAuth(),
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api/v1' },
    { key: 'accessToken', value: '' },
    { key: 'refreshToken', value: '' },
    { key: 'userId', value: '' },
    { key: 'sellerId', value: '' },
    { key: 'shopId', value: '' },
    { key: 'productId', value: '' },
    { key: 'categoryId', value: '' },
    { key: 'orderId', value: '' },
    { key: 'paymentId', value: '' },
    { key: 'deliveryId', value: '' },
    { key: 'reviewId', value: '' },
    { key: 'sessionId', value: '' },
    { key: 'passkeyId', value: '' },
    { key: 'kycId', value: '' },
    { key: 'planId', value: '' },
    { key: 'subscriptionId', value: '' },
    { key: 'invoiceId', value: '' },
    { key: 'incidentId', value: '' },
    { key: 'blogPostId', value: '' },
    { key: 'heroSlideId', value: '' },
    { key: 'expenseId', value: '' },
    { key: 'walletId', value: '' },
    { key: 'depositId', value: '' },
    { key: 'payoutId', value: '' },
    { key: 'refundId', value: '' },
    { key: 'transactionId', value: '' },
    { key: 'contactMessageId', value: '' },
    { key: 'notificationId', value: '' },
    { key: 'variantId', value: '' },
    { key: 'riderDeliveryId', value: '' },
    { key: 'riderId', value: '' },
    { key: 'itemId', value: '' },
    { key: 'healthToken', value: '' }
  ],
  item: []
};

// ============ HEALTH ============
collection.item.push(makeFolder('Health', [
  makeRequest('Health Check', 'GET', 'health', {
    description: desc('Health Check', 'GET', 'health', false, null, '200 OK', { status: 'ok', timestamp: '2026-01-01T00:00:00.000Z' }),
    responses: makeResponses(200, { status: 'ok', timestamp: '2026-01-01T00:00:00.000Z' })
  }),
  makeRequest('Detailed Health Check', 'GET', 'health/detailed', {
    headers: [{ key: 'Content-Type', value: 'application/json' }, { key: 'x-health-token', value: '{{healthToken}}' }],
    description: desc('Detailed Health Check', 'GET', 'health/detailed', false, null, '200 OK', { status: 'ok', database: 'connected', redis: 'connected' }),
    responses: makeResponses(200, { status: 'ok', database: 'connected', redis: 'connected' }, [[401, 'UNAUTHORIZED', 'Invalid health token']])
  })
]));

// ============ AUTH ============
const authItems = [
  makeRequest('Create Account', 'POST', 'auth/create-account', {
    body: { name: 'John Doe', email: 'john@example.com', locale: 'en', role: 'BUYER' },
    description: desc('Create Account', 'POST', 'auth/create-account', false, { name: 'John Doe', email: 'john@example.com', locale: 'en', role: 'BUYER' }, '201 Created', { message: 'Verification email sent' }, validationErrors),
    responses: makeResponses(201, { message: 'Verification email sent' }, [[400, 'BAD_REQUEST', 'Validation failed'], [409, 'CONFLICT', 'Email already exists']])
  }),
  makeRequest('Verify Email', 'POST', 'auth/verify-email', {
    body: { email: 'john@example.com', code: '123456' },
    description: desc('Verify Email', 'POST', 'auth/verify-email', false, { email: 'john@example.com', code: '123456' }, '200 OK', { message: 'Email verified' }),
    responses: makeResponses(200, { message: 'Email verified' }, validationErrors)
  }),
  makeRequest('Resend Verification', 'POST', 'auth/resend-verification', {
    body: { email: 'john@example.com', locale: 'en' },
    description: desc('Resend Verification', 'POST', 'auth/resend-verification', false, { email: 'john@example.com', locale: 'en' }, '200 OK', { message: 'Verification code resent' }),
    responses: makeResponses(200, { message: 'Verification code resent' }, validationErrors)
  }),
  makeRequest('Request OTP', 'POST', 'auth/login/request-otp', {
    body: { email: 'john@example.com', locale: 'en' },
    description: desc('Request OTP', 'POST', 'auth/login/request-otp', false, { email: 'john@example.com', locale: 'en' }, '200 OK', { message: 'OTP sent' }),
    responses: makeResponses(200, { message: 'OTP sent' }, validationErrors)
  }),
  makeRequest('Verify OTP', 'POST', 'auth/login/verify-otp', {
    body: { email: 'john@example.com', code: '123456', deviceName: 'iPhone 15' },
    description: desc('Verify OTP', 'POST', 'auth/login/verify-otp', false, { email: 'john@example.com', code: '123456', deviceName: 'iPhone 15' }, '200 OK', { user: { id: 'usr_123', name: 'John', email: 'john@example.com' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }),
    events: testSaveTokens(),
    responses: makeResponses(200, { user: { id: 'usr_123', name: 'John' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }, [[400, 'BAD_REQUEST', 'Invalid OTP']])
  }),
  makeRequest('Login with Password', 'POST', 'auth/login/password', {
    body: { email: 'john@example.com', password: 'SecurePass123!', deviceName: 'iPhone 15', locale: 'en' },
    description: desc('Login with Password', 'POST', 'auth/login/password', false, { email: 'john@example.com', password: 'SecurePass123!', deviceName: 'iPhone 15', locale: 'en' }, '200 OK', { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }),
    events: testSaveTokens(),
    responses: makeResponses(200, { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }, [[401, 'UNAUTHORIZED', 'Invalid credentials']])
  }),
  makeRequest('Login with TOTP', 'POST', 'auth/login/totp', {
    body: { pendingToken: 'pend_token_123', code: '123456', deviceName: 'iPhone 15', locale: 'en' },
    description: desc('Login with TOTP', 'POST', 'auth/login/totp', false, null, '200 OK', { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }),
    events: testSaveTokens(),
    responses: makeResponses(200, { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }, [[401, 'UNAUTHORIZED', 'Invalid TOTP code']])
  }),
  makeRequest('Login with Google', 'POST', 'auth/login/google', {
    body: { idToken: 'google_id_token_123', deviceName: 'iPhone 15', locale: 'en' },
    description: desc('Login with Google', 'POST', 'auth/login/google', false, null, '200 OK', { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }),
    events: testSaveTokens(),
    responses: makeResponses(200, { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }, [[401, 'UNAUTHORIZED', 'Invalid Google token']])
  }),
  makeRequest('Register with Google', 'POST', 'auth/register/google', {
    body: { idToken: 'google_id_token_123', role: 'BUYER', deviceName: 'iPhone 15', locale: 'en' },
    description: desc('Register with Google', 'POST', 'auth/register/google', false, null, '201 Created', { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }),
    events: testSaveTokens(),
    responses: makeResponses(201, { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }, [[409, 'CONFLICT', 'Account already exists']])
  }),
  makeRequest('Refresh Token', 'POST', 'auth/refresh-token', {
    body: { refreshToken: '{{refreshToken}}' },
    description: desc('Refresh Token', 'POST', 'auth/refresh-token', false, { refreshToken: '{{refreshToken}}' }, '200 OK', { accessToken: 'eyJ...' }),
    events: testSaveRefresh(),
    responses: makeResponses(200, { accessToken: 'eyJ...' }, [[401, 'UNAUTHORIZED', 'Invalid refresh token']])
  }),
  makeRequest('Get Current User', 'GET', 'auth/me', {
    auth: true,
    description: desc('Get Current User', 'GET', 'auth/me', true, null, '200 OK', { id: 'usr_123', name: 'John', email: 'john@example.com', role: 'BUYER' }),
    responses: makeResponses(200, { id: 'usr_123', name: 'John', email: 'john@example.com' }, authErrors)
  }),
  makeRequest('Logout', 'POST', 'auth/logout', {
    auth: true,
    description: desc('Logout', 'POST', 'auth/logout', true, null, '200 OK', { message: 'Logged out' }),
    responses: makeResponses(200, { message: 'Logged out' }, authErrors)
  }),
  makeRequest('Logout All', 'POST', 'auth/logout-all', {
    auth: true,
    description: desc('Logout All Sessions', 'POST', 'auth/logout-all', true, null, '200 OK', { message: 'All sessions terminated' }),
    responses: makeResponses(200, { message: 'All sessions terminated' }, authErrors)
  }),
  makeRequest('Get Sessions', 'GET', 'auth/sessions', {
    auth: true,
    description: desc('Get Sessions', 'GET', 'auth/sessions', true, null, '200 OK', { sessions: [] }),
    responses: makeResponses(200, { sessions: [{ id: 'sess_123', deviceName: 'iPhone 15', createdAt: '2026-01-01' }] }, authErrors)
  }),
  makeRequest('Delete Session', 'DELETE', 'auth/sessions/{{sessionId}}', {
    auth: true,
    description: desc('Delete Session', 'DELETE', 'auth/sessions/:sessionId', true, null, '200 OK', { message: 'Session deleted' }),
    responses: makeResponses(200, { message: 'Session deleted' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Create Password', 'POST', 'auth/password/create', {
    auth: true, body: { password: 'NewSecurePass123!', locale: 'en' },
    description: desc('Create Password', 'POST', 'auth/password/create', true, { password: 'NewSecurePass123!', locale: 'en' }, '200 OK', { message: 'Password created' }),
    responses: makeResponses(200, { message: 'Password created' }, [...authErrors, [409, 'CONFLICT', 'Password already exists']])
  }),
  makeRequest('Update Password', 'POST', 'auth/password/update', {
    auth: true, body: { currentPassword: 'OldPass123!', newPassword: 'NewPass456!', locale: 'en' },
    description: desc('Update Password', 'POST', 'auth/password/update', true, null, '200 OK', { message: 'Password updated' }),
    responses: makeResponses(200, { message: 'Password updated' }, [...authErrors, [400, 'BAD_REQUEST', 'Current password incorrect']])
  }),
  makeRequest('Forgot Password', 'POST', 'auth/password/forgot', {
    body: { email: 'john@example.com', locale: 'en' },
    description: desc('Forgot Password', 'POST', 'auth/password/forgot', false, null, '200 OK', { message: 'Reset code sent' }),
    responses: makeResponses(200, { message: 'Reset code sent' }, validationErrors)
  }),
  makeRequest('Reset Password', 'POST', 'auth/password/reset', {
    body: { email: 'john@example.com', code: '123456', newPassword: 'NewPass789!', locale: 'en' },
    description: desc('Reset Password', 'POST', 'auth/password/reset', false, null, '200 OK', { message: 'Password reset successful' }),
    responses: makeResponses(200, { message: 'Password reset successful' }, [[400, 'BAD_REQUEST', 'Invalid or expired code']])
  }),
  makeRequest('TOTP Setup', 'POST', 'auth/totp/setup', {
    auth: true,
    description: desc('TOTP Setup', 'POST', 'auth/totp/setup', true, null, '200 OK', { secret: 'JBSWY3DPEHPK3PXP', qrCode: 'data:image/png;base64,...' }),
    responses: makeResponses(200, { secret: 'JBSWY3DPEHPK3PXP', qrCode: 'data:image/png;base64,...' }, authErrors)
  }),
  makeRequest('TOTP Confirm', 'POST', 'auth/totp/confirm', {
    auth: true, body: { code: '123456' },
    description: desc('TOTP Confirm', 'POST', 'auth/totp/confirm', true, { code: '123456' }, '200 OK', { message: 'TOTP enabled', backupCodes: ['code1', 'code2'] }),
    responses: makeResponses(200, { message: 'TOTP enabled', backupCodes: ['code1', 'code2'] }, [...authErrors, [400, 'BAD_REQUEST', 'Invalid code']])
  }),
  makeRequest('TOTP Disable', 'POST', 'auth/totp/disable', {
    auth: true, body: { code: '123456', locale: 'en' },
    description: desc('TOTP Disable', 'POST', 'auth/totp/disable', true, null, '200 OK', { message: 'TOTP disabled' }),
    responses: makeResponses(200, { message: 'TOTP disabled' }, authErrors)
  }),
  makeRequest('TOTP Regenerate Backup Codes', 'POST', 'auth/totp/regenerate-backup-codes', {
    auth: true, body: { code: '123456', locale: 'en' },
    description: desc('TOTP Regenerate Backup Codes', 'POST', 'auth/totp/regenerate-backup-codes', true, null, '200 OK', { backupCodes: ['new1', 'new2'] }),
    responses: makeResponses(200, { backupCodes: ['new1', 'new2'] }, authErrors)
  }),
  makeRequest('Passkey Register Options', 'POST', 'auth/passkey/register/options', {
    auth: true,
    description: desc('Passkey Register Options', 'POST', 'auth/passkey/register/options', true, null, '200 OK', { options: {} }),
    responses: makeResponses(200, { options: { challenge: 'abc', rp: { name: 'SwiftGoma' } } }, authErrors)
  }),
  makeRequest('Passkey Register Verify', 'POST', 'auth/passkey/register/verify', {
    auth: true, body: { response: {}, deviceName: 'MacBook Pro' },
    description: desc('Passkey Register Verify', 'POST', 'auth/passkey/register/verify', true, null, '201 Created', { id: 'pk_123', deviceName: 'MacBook Pro' }),
    events: testSaveId('passkeyId'),
    responses: makeResponses(201, { id: 'pk_123', deviceName: 'MacBook Pro' }, authErrors)
  }),
  makeRequest('Passkey Login Options', 'POST', 'auth/passkey/login/options', {
    body: { email: 'john@example.com' },
    description: desc('Passkey Login Options', 'POST', 'auth/passkey/login/options', false, null, '200 OK', { options: {}, challengeId: 'ch_123' }),
    responses: makeResponses(200, { options: {}, challengeId: 'ch_123' }, validationErrors)
  }),
  makeRequest('Passkey Login Verify', 'POST', 'auth/passkey/login/verify', {
    body: { email: 'john@example.com', challengeId: 'ch_123', response: {}, deviceName: 'MacBook Pro', locale: 'en' },
    description: desc('Passkey Login Verify', 'POST', 'auth/passkey/login/verify', false, null, '200 OK', { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }),
    events: testSaveTokens(),
    responses: makeResponses(200, { user: { id: 'usr_123' }, accessToken: 'eyJ...', refreshToken: 'eyJ...' }, [[401, 'UNAUTHORIZED', 'Passkey verification failed']])
  }),
  makeRequest('Get Passkeys', 'GET', 'auth/passkey', {
    auth: true,
    description: desc('Get Passkeys', 'GET', 'auth/passkey', true, null, '200 OK', { passkeys: [] }),
    responses: makeResponses(200, { passkeys: [{ id: 'pk_123', deviceName: 'MacBook Pro' }] }, authErrors)
  }),
  makeRequest('Delete Passkey', 'DELETE', 'auth/passkey/{{passkeyId}}', {
    auth: true,
    description: desc('Delete Passkey', 'DELETE', 'auth/passkey/:passkeyId', true, null, '200 OK', { message: 'Passkey deleted' }),
    responses: makeResponses(200, { message: 'Passkey deleted' }, [...authErrors, ...notFoundErrors])
  })
];
collection.item.push(makeFolder('Auth', authItems));

// ============ USERS ============
const usersItems = [
  makeRequest('Update Profile', 'PATCH', 'users/profile', {
    auth: true, body: { name: 'John Updated', avatarUrl: 'https://example.com/avatar.jpg', preferredCurrency: 'USD' },
    description: desc('Update Profile', 'PATCH', 'users/profile', true, null, '200 OK', { id: 'usr_123', name: 'John Updated' }),
    responses: makeResponses(200, { id: 'usr_123', name: 'John Updated' }, authErrors)
  }),
  makeRequest('Upload Avatar', 'POST', 'users/profile/avatar', {
    auth: true,
    formdata: [{ key: 'avatar', type: 'file', src: '/path/to/avatar.jpg' }],
    description: desc('Upload Avatar', 'POST', 'users/profile/avatar', true, null, '200 OK', { avatarUrl: 'https://cdn.example.com/avatar.jpg' }),
    responses: makeResponses(200, { avatarUrl: 'https://cdn.example.com/avatar.jpg' }, authErrors)
  }),
  makeRequest('Delete Account', 'POST', 'users/delete', {
    auth: true, body: { reason: 'No longer needed', locale: 'en' },
    description: desc('Delete Account', 'POST', 'users/delete', true, null, '200 OK', { message: 'Account scheduled for deletion' }),
    responses: makeResponses(200, { message: 'Account scheduled for deletion' }, authErrors)
  }),
  makeRequest('Request Account Recovery', 'POST', 'users/recovery/request', {
    body: { email: 'john@example.com', locale: 'en' },
    description: desc('Request Account Recovery', 'POST', 'users/recovery/request', false, null, '200 OK', { message: 'Recovery code sent' }),
    responses: makeResponses(200, { message: 'Recovery code sent' }, validationErrors)
  }),
  makeRequest('Verify Account Recovery', 'POST', 'users/recovery/verify', {
    body: { email: 'john@example.com', code: '123456', deviceName: 'iPhone 15', locale: 'en' },
    description: desc('Verify Account Recovery', 'POST', 'users/recovery/verify', false, null, '200 OK', { user: { id: 'usr_123' }, accessToken: 'eyJ...' }),
    events: testSaveTokens(),
    responses: makeResponses(200, { user: { id: 'usr_123' }, accessToken: 'eyJ...' }, validationErrors)
  }),
  makeRequest('Request Phone Verification', 'POST', 'users/phone/request', {
    auth: true, body: { phone: '+243999000111' },
    description: desc('Request Phone Verification', 'POST', 'users/phone/request', true, null, '200 OK', { message: 'Code sent' }),
    responses: makeResponses(200, { message: 'Code sent' }, authErrors)
  }),
  makeRequest('Verify Phone', 'POST', 'users/phone/verify', {
    auth: true, body: { code: '123456', locale: 'en' },
    description: desc('Verify Phone', 'POST', 'users/phone/verify', true, null, '200 OK', { message: 'Phone verified' }),
    responses: makeResponses(200, { message: 'Phone verified' }, authErrors)
  }),
  makeRequest('Request Phone Update', 'POST', 'users/phone/update/request', {
    auth: true, body: { newPhone: '+243999000222' },
    description: desc('Request Phone Update', 'POST', 'users/phone/update/request', true, null, '200 OK', { message: 'Code sent' }),
    responses: makeResponses(200, { message: 'Code sent' }, authErrors)
  }),
  makeRequest('Verify Phone Update', 'POST', 'users/phone/update/verify', {
    auth: true, body: { code: '123456', locale: 'en' },
    description: desc('Verify Phone Update', 'POST', 'users/phone/update/verify', true, null, '200 OK', { message: 'Phone updated' }),
    responses: makeResponses(200, { message: 'Phone updated' }, authErrors)
  }),
  makeRequest('Request Secondary Email', 'POST', 'users/email/secondary/request', {
    auth: true, body: { email: 'john.secondary@example.com', locale: 'en' },
    description: desc('Request Secondary Email', 'POST', 'users/email/secondary/request', true, null, '200 OK', { message: 'Verification sent' }),
    responses: makeResponses(200, { message: 'Verification sent' }, authErrors)
  }),
  makeRequest('Verify Secondary Email', 'POST', 'users/email/secondary/verify', {
    auth: true, body: { code: '123456', locale: 'en' },
    description: desc('Verify Secondary Email', 'POST', 'users/email/secondary/verify', true, null, '200 OK', { message: 'Secondary email verified' }),
    responses: makeResponses(200, { message: 'Secondary email verified' }, authErrors)
  }),
  makeRequest('Remove Secondary Email', 'DELETE', 'users/email/secondary', {
    auth: true,
    description: desc('Remove Secondary Email', 'DELETE', 'users/email/secondary', true, null, '200 OK', { message: 'Secondary email removed' }),
    responses: makeResponses(200, { message: 'Secondary email removed' }, authErrors)
  }),
  makeRequest('Link Google Account', 'POST', 'users/google/link', {
    auth: true, body: { idToken: 'google_id_token_123' },
    description: desc('Link Google Account', 'POST', 'users/google/link', true, null, '200 OK', { message: 'Google account linked' }),
    responses: makeResponses(200, { message: 'Google account linked' }, authErrors)
  }),
  makeRequest('Unlink Google Account', 'POST', 'users/google/unlink', {
    auth: true,
    description: desc('Unlink Google Account', 'POST', 'users/google/unlink', true, null, '200 OK', { message: 'Google account unlinked' }),
    responses: makeResponses(200, { message: 'Google account unlinked' }, authErrors)
  }),
  makeRequest('List Users (Admin)', 'GET', 'users', {
    auth: true, query: [{ key: 'page', value: '1' }, { key: 'limit', value: '20' }, { key: 'search', value: '' }, { key: 'role', value: '' }],
    description: desc('List Users', 'GET', 'users', true, null, '200 OK', { users: [], pagination: {} }),
    responses: makeResponses(200, { users: [], pagination: { page: 1, limit: 20, total: 0 } }, authErrors)
  }),
  makeRequest('Get User by ID (Admin)', 'GET', 'users/{{userId}}', {
    auth: true,
    description: desc('Get User by ID', 'GET', 'users/:id', true, null, '200 OK', { id: 'usr_123', name: 'John' }),
    responses: makeResponses(200, { id: 'usr_123', name: 'John' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Block User (Admin)', 'POST', 'users/{{userId}}/block', {
    auth: true, body: { reason: 'Violation of terms' },
    description: desc('Block User', 'POST', 'users/:id/block', true, null, '200 OK', { message: 'User blocked' }),
    responses: makeResponses(200, { message: 'User blocked' }, authErrors)
  }),
  makeRequest('Unblock User (Admin)', 'POST', 'users/{{userId}}/unblock', {
    auth: true, body: { reason: 'Appeal approved' },
    description: desc('Unblock User', 'POST', 'users/:id/unblock', true, null, '200 OK', { message: 'User unblocked' }),
    responses: makeResponses(200, { message: 'User unblocked' }, authErrors)
  }),
  makeRequest('Force Logout User (Admin)', 'POST', 'users/{{userId}}/force-logout', {
    auth: true, body: { sessionId: 'sess_123', reason: 'Security concern' },
    description: desc('Force Logout User', 'POST', 'users/:id/force-logout', true, null, '200 OK', { message: 'User logged out' }),
    responses: makeResponses(200, { message: 'User logged out' }, authErrors)
  }),
  makeRequest('Verify User Email (Admin)', 'POST', 'users/{{userId}}/verify-email', {
    auth: true, body: { emailId: 'email_123' },
    description: desc('Verify User Email', 'POST', 'users/:id/verify-email', true, null, '200 OK', { message: 'Email verified' }),
    responses: makeResponses(200, { message: 'Email verified' }, authErrors)
  }),
  makeRequest('Verify User Phone (Admin)', 'POST', 'users/{{userId}}/verify-phone', {
    auth: true,
    description: desc('Verify User Phone', 'POST', 'users/:id/verify-phone', true, null, '200 OK', { message: 'Phone verified' }),
    responses: makeResponses(200, { message: 'Phone verified' }, authErrors)
  }),
  makeRequest('Delete User (Admin)', 'POST', 'users/{{userId}}/delete', {
    auth: true, body: { reason: 'Account cleanup' },
    description: desc('Delete User (Admin)', 'POST', 'users/:id/delete', true, null, '200 OK', { message: 'User deleted' }),
    responses: makeResponses(200, { message: 'User deleted' }, authErrors)
  }),
  makeRequest('Restore User (Admin)', 'POST', 'users/{{userId}}/restore', {
    auth: true, body: { reason: 'Mistaken deletion' },
    description: desc('Restore User (Admin)', 'POST', 'users/:id/restore', true, null, '200 OK', { message: 'User restored' }),
    responses: makeResponses(200, { message: 'User restored' }, authErrors)
  }),
  makeRequest('Change User Role (Admin)', 'POST', 'users/{{userId}}/role', {
    auth: true, body: { role: 'SELLER', reason: 'Upgrade request' },
    description: desc('Change User Role', 'POST', 'users/:id/role', true, null, '200 OK', { message: 'Role updated' }),
    responses: makeResponses(200, { message: 'Role updated' }, authErrors)
  })
];
collection.item.push(makeFolder('Users', usersItems));

// ============ SELLER ============
const sellerItems = [
  makeRequest('Get Shop by Slug (Public)', 'GET', 'seller/shop/slug/my-awesome-shop', {
    description: desc('Get Shop by Slug', 'GET', 'seller/shop/slug/:slug', false, null, '200 OK', { id: 'shop_123', name: 'My Shop', slug: 'my-awesome-shop' }),
    responses: makeResponses(200, { id: 'shop_123', name: 'My Shop', slug: 'my-awesome-shop' }, notFoundErrors)
  }),
  makeRequest('List Shops (Public)', 'GET', 'seller/shops', {
    description: desc('List Shops', 'GET', 'seller/shops', false, null, '200 OK', { shops: [] }),
    responses: makeResponses(200, { shops: [] })
  }),
  makeRequest('Create Seller Profile', 'POST', 'seller', {
    auth: true,
    formdata: [
      { key: 'businessName', value: 'My Business', type: 'text' },
      { key: 'businessType', value: 'INDIVIDUAL', type: 'text' },
      { key: 'phone', value: '+243999000111', type: 'text' },
      { key: 'logo', type: 'file', src: '/path/to/logo.png' },
      { key: 'banner', type: 'file', src: '/path/to/banner.png' }
    ],
    description: desc('Create Seller Profile', 'POST', 'seller', true, null, '201 Created', { id: 'sel_123', businessName: 'My Business' }),
    events: testSaveId('sellerId'),
    responses: makeResponses(201, { id: 'sel_123', businessName: 'My Business' }, [...authErrors, [409, 'CONFLICT', 'Seller profile already exists']])
  }),
  makeRequest('Get My Seller Profile', 'GET', 'seller/my-profile', {
    auth: true,
    description: desc('Get My Seller Profile', 'GET', 'seller/my-profile', true, null, '200 OK', { id: 'sel_123', businessName: 'My Business' }),
    responses: makeResponses(200, { id: 'sel_123', businessName: 'My Business' }, authErrors)
  }),
  makeRequest('Update Seller Profile', 'PUT', 'seller', {
    auth: true,
    formdata: [
      { key: 'businessName', value: 'Updated Business', type: 'text' },
      { key: 'logo', type: 'file', src: '/path/to/logo.png' },
      { key: 'banner', type: 'file', src: '/path/to/banner.png' }
    ],
    description: desc('Update Seller Profile', 'PUT', 'seller', true, null, '200 OK', { id: 'sel_123', businessName: 'Updated Business' }),
    responses: makeResponses(200, { id: 'sel_123', businessName: 'Updated Business' }, authErrors)
  }),
  makeRequest('Suspend Seller (Admin)', 'POST', 'seller/{{userId}}/suspend', {
    auth: true,
    description: desc('Suspend Seller', 'POST', 'seller/:userId/suspend', true, null, '200 OK', { message: 'Seller suspended' }),
    responses: makeResponses(200, { message: 'Seller suspended' }, authErrors)
  }),
  makeRequest('Reactivate Seller (Admin)', 'POST', 'seller/{{userId}}/reactivate', {
    auth: true,
    description: desc('Reactivate Seller', 'POST', 'seller/:userId/reactivate', true, null, '200 OK', { message: 'Seller reactivated' }),
    responses: makeResponses(200, { message: 'Seller reactivated' }, authErrors)
  })
];
collection.item.push(makeFolder('Seller', sellerItems));

// ============ SELLER KYC ============
const kycItems = [
  makeRequest('Submit KYC', 'POST', 'seller/kyc', {
    auth: true,
    formdata: [
      { key: 'idDocument', type: 'file', src: '/path/to/id.pdf' },
      { key: 'proofOfAddress', type: 'file', src: '/path/to/proof.pdf' },
      { key: 'selfie', type: 'file', src: '/path/to/selfie.jpg' },
      { key: 'rccmDocument', type: 'file', src: '/path/to/rccm.pdf' }
    ],
    description: desc('Submit KYC', 'POST', 'seller/kyc', true, null, '201 Created', { id: 'kyc_123', status: 'PENDING' }),
    events: testSaveId('kycId'),
    responses: makeResponses(201, { id: 'kyc_123', status: 'PENDING' }, authErrors)
  }),
  makeRequest('Get My KYC', 'GET', 'seller/kyc/my-kyc', {
    auth: true,
    description: desc('Get My KYC', 'GET', 'seller/kyc/my-kyc', true, null, '200 OK', { id: 'kyc_123', status: 'PENDING' }),
    responses: makeResponses(200, { id: 'kyc_123', status: 'PENDING' }, authErrors)
  }),
  makeRequest('Resubmit KYC', 'POST', 'seller/kyc/resubmit', {
    auth: true,
    formdata: [
      { key: 'idDocument', type: 'file', src: '/path/to/id.pdf' },
      { key: 'proofOfAddress', type: 'file', src: '/path/to/proof.pdf' },
      { key: 'selfie', type: 'file', src: '/path/to/selfie.jpg' },
      { key: 'rccmDocument', type: 'file', src: '/path/to/rccm.pdf' }
    ],
    description: desc('Resubmit KYC', 'POST', 'seller/kyc/resubmit', true, null, '200 OK', { id: 'kyc_123', status: 'PENDING' }),
    responses: makeResponses(200, { id: 'kyc_123', status: 'PENDING' }, authErrors)
  }),
  makeRequest('List KYC (Admin)', 'GET', 'seller/kyc', {
    auth: true,
    description: desc('List KYC', 'GET', 'seller/kyc', true, null, '200 OK', { submissions: [] }),
    responses: makeResponses(200, { submissions: [] }, authErrors)
  }),
  makeRequest('Get KYC by ID (Admin)', 'GET', 'seller/kyc/{{kycId}}', {
    auth: true,
    description: desc('Get KYC by ID', 'GET', 'seller/kyc/:id', true, null, '200 OK', { id: 'kyc_123', status: 'PENDING' }),
    responses: makeResponses(200, { id: 'kyc_123', status: 'PENDING' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Support Review KYC', 'POST', 'seller/kyc/{{kycId}}/support-review', {
    auth: true,
    description: desc('Support Review KYC', 'POST', 'seller/kyc/:id/support-review', true, null, '200 OK', { message: 'KYC marked for review' }),
    responses: makeResponses(200, { message: 'KYC marked for review' }, authErrors)
  }),
  makeRequest('Reject KYC', 'POST', 'seller/kyc/{{kycId}}/reject', {
    auth: true,
    description: desc('Reject KYC', 'POST', 'seller/kyc/:id/reject', true, null, '200 OK', { message: 'KYC rejected' }),
    responses: makeResponses(200, { message: 'KYC rejected' }, authErrors)
  }),
  makeRequest('Approve KYC', 'POST', 'seller/kyc/{{kycId}}/approve', {
    auth: true,
    description: desc('Approve KYC', 'POST', 'seller/kyc/:id/approve', true, null, '200 OK', { message: 'KYC approved' }),
    responses: makeResponses(200, { message: 'KYC approved' }, authErrors)
  })
];
collection.item.push(makeFolder('Seller KYC', kycItems));

// ============ SHOPS ============
const shopItems = [
  makeRequest('Create Shop', 'POST', 'seller/shop', {
    auth: true,
    formdata: [
      { key: 'name', value: 'My Awesome Shop', type: 'text' },
      { key: 'slug', value: 'my-awesome-shop', type: 'text' },
      { key: 'description', value: 'Best shop in town', type: 'text' },
      { key: 'logo', type: 'file', src: '/path/to/logo.png' },
      { key: 'banner', type: 'file', src: '/path/to/banner.png' }
    ],
    description: desc('Create Shop', 'POST', 'seller/shop', true, null, '201 Created', { id: 'shop_123', name: 'My Awesome Shop' }),
    events: testSaveId('shopId'),
    responses: makeResponses(201, { id: 'shop_123', name: 'My Awesome Shop' }, authErrors)
  }),
  makeRequest('Get My Shop', 'GET', 'seller/shop/me', {
    auth: true,
    description: desc('Get My Shop', 'GET', 'seller/shop/me', true, null, '200 OK', { id: 'shop_123', name: 'My Shop' }),
    responses: makeResponses(200, { id: 'shop_123', name: 'My Shop' }, authErrors)
  }),
  makeRequest('Update Shop', 'PUT', 'seller/shop/{{shopId}}', {
    auth: true,
    formdata: [
      { key: 'name', value: 'Updated Shop Name', type: 'text' },
      { key: 'logo', type: 'file', src: '/path/to/logo.png' },
      { key: 'banner', type: 'file', src: '/path/to/banner.png' }
    ],
    description: desc('Update Shop', 'PUT', 'seller/shop/:id', true, null, '200 OK', { id: 'shop_123', name: 'Updated Shop Name' }),
    responses: makeResponses(200, { id: 'shop_123', name: 'Updated Shop Name' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Publish Shop', 'POST', 'seller/shop/{{shopId}}/publish', {
    auth: true,
    description: desc('Publish Shop', 'POST', 'seller/shop/:id/publish', true, null, '200 OK', { message: 'Shop published' }),
    responses: makeResponses(200, { message: 'Shop published' }, authErrors)
  }),
  makeRequest('Unpublish Shop', 'POST', 'seller/shop/{{shopId}}/unpublish', {
    auth: true,
    description: desc('Unpublish Shop', 'POST', 'seller/shop/:id/unpublish', true, null, '200 OK', { message: 'Shop unpublished' }),
    responses: makeResponses(200, { message: 'Shop unpublished' }, authErrors)
  }),
  makeRequest('Suspend Shop', 'POST', 'seller/shop/{{shopId}}/suspend', {
    auth: true,
    description: desc('Suspend Shop', 'POST', 'seller/shop/:id/suspend', true, null, '200 OK', { message: 'Shop suspended' }),
    responses: makeResponses(200, { message: 'Shop suspended' }, authErrors)
  }),
  makeRequest('Reactivate Shop', 'POST', 'seller/shop/{{shopId}}/reactivate', {
    auth: true,
    description: desc('Reactivate Shop', 'POST', 'seller/shop/:id/reactivate', true, null, '200 OK', { message: 'Shop reactivated' }),
    responses: makeResponses(200, { message: 'Shop reactivated' }, authErrors)
  }),
  makeRequest('Delete Shop', 'DELETE', 'seller/shop/{{shopId}}', {
    auth: true,
    description: desc('Delete Shop', 'DELETE', 'seller/shop/:id', true, null, '200 OK', { message: 'Shop deleted' }),
    responses: makeResponses(200, { message: 'Shop deleted' }, authErrors)
  }),
  makeRequest('List Shops (Admin)', 'GET', 'seller/shops/admin', {
    auth: true,
    description: desc('List Shops (Admin)', 'GET', 'seller/shops/admin', true, null, '200 OK', { shops: [] }),
    responses: makeResponses(200, { shops: [] }, authErrors)
  }),
  makeRequest('Admin Suspend Shop', 'POST', 'seller/shop/{{shopId}}/admin/suspend', {
    auth: true,
    description: desc('Admin Suspend Shop', 'POST', 'seller/shop/:id/admin/suspend', true, null, '200 OK', { message: 'Shop suspended' }),
    responses: makeResponses(200, { message: 'Shop suspended' }, authErrors)
  }),
  makeRequest('Admin Reactivate Shop', 'POST', 'seller/shop/{{shopId}}/admin/reactivate', {
    auth: true,
    description: desc('Admin Reactivate Shop', 'POST', 'seller/shop/:id/admin/reactivate', true, null, '200 OK', { message: 'Shop reactivated' }),
    responses: makeResponses(200, { message: 'Shop reactivated' }, authErrors)
  }),
  makeRequest('Admin Delete Shop', 'DELETE', 'seller/shop/{{shopId}}/admin', {
    auth: true,
    description: desc('Admin Delete Shop', 'DELETE', 'seller/shop/:id/admin', true, null, '200 OK', { message: 'Shop deleted' }),
    responses: makeResponses(200, { message: 'Shop deleted' }, authErrors)
  }),
  makeRequest('Restore Shop', 'POST', 'seller/shop/{{shopId}}/restore', {
    auth: true,
    description: desc('Restore Shop', 'POST', 'seller/shop/:id/restore', true, null, '200 OK', { message: 'Shop restored' }),
    responses: makeResponses(200, { message: 'Shop restored' }, authErrors)
  })
];
collection.item.push(makeFolder('Shops', shopItems));

// ============ PRODUCTS ============
const productItems = [
  makeRequest('List Categories (Public)', 'GET', 'products/categories', {
    description: desc('List Categories', 'GET', 'products/categories', false, null, '200 OK', { categories: [] }),
    responses: makeResponses(200, { categories: [{ id: 'cat_123', name: 'Electronics', slug: 'electronics' }] })
  }),
  makeRequest('Get Category by ID (Public)', 'GET', 'products/categories/{{categoryId}}', {
    description: desc('Get Category', 'GET', 'products/categories/:id', false, null, '200 OK', { id: 'cat_123', name: 'Electronics' }),
    responses: makeResponses(200, { id: 'cat_123', name: 'Electronics' }, notFoundErrors)
  }),
  makeRequest('List Products (Public)', 'GET', 'products', {
    query: [{ key: 'page', value: '1' }, { key: 'limit', value: '20' }, { key: 'search', value: '' }, { key: 'categoryId', value: '' }, { key: 'shopId', value: '' }, { key: 'minPrice', value: '' }, { key: 'maxPrice', value: '' }, { key: 'sortBy', value: 'createdAt' }, { key: 'currency', value: 'USD' }],
    description: desc('List Products', 'GET', 'products', false, null, '200 OK', { products: [], pagination: {} }),
    responses: makeResponses(200, { products: [], pagination: { page: 1, limit: 20, total: 0 } })
  }),
  makeRequest('Popular Products (Public)', 'GET', 'products/popular', {
    description: desc('Popular Products', 'GET', 'products/popular', false, null, '200 OK', { products: [] }),
    responses: makeResponses(200, { products: [] })
  }),
  makeRequest('Get Product by Slug (Public)', 'GET', 'products/slug/awesome-product', {
    description: desc('Get Product by Slug', 'GET', 'products/slug/:slug', false, null, '200 OK', { id: 'prod_123', name: 'Awesome Product' }),
    responses: makeResponses(200, { id: 'prod_123', name: 'Awesome Product', slug: 'awesome-product' }, notFoundErrors)
  }),
  makeRequest('Create Category (Admin)', 'POST', 'products/categories', {
    auth: true, body: { name: 'Electronics', slug: 'electronics', icon: 'laptop', description: 'Electronic devices' },
    description: desc('Create Category', 'POST', 'products/categories', true, null, '201 Created', { id: 'cat_123', name: 'Electronics' }),
    events: testSaveId('categoryId'),
    responses: makeResponses(201, { id: 'cat_123', name: 'Electronics' }, authErrors)
  }),
  makeRequest('Update Category (Admin)', 'PUT', 'products/categories/{{categoryId}}', {
    auth: true, body: { name: 'Electronics Updated', slug: 'electronics', icon: 'laptop', description: 'Updated' },
    description: desc('Update Category', 'PUT', 'products/categories/:id', true, null, '200 OK', { id: 'cat_123', name: 'Electronics Updated' }),
    responses: makeResponses(200, { id: 'cat_123', name: 'Electronics Updated' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Create Subcategory (Admin)', 'POST', 'products/categories/{{categoryId}}/subcategories', {
    auth: true, body: { name: 'Laptops', slug: 'laptops' },
    description: desc('Create Subcategory', 'POST', 'products/categories/:categoryId/subcategories', true, null, '201 Created', { id: 'sub_123', name: 'Laptops' }),
    responses: makeResponses(201, { id: 'sub_123', name: 'Laptops' }, authErrors)
  }),
  makeRequest('Update Subcategory (Admin)', 'PUT', 'products/categories/subcategories/{{categoryId}}', {
    auth: true, body: { name: 'Laptops Updated', slug: 'laptops-updated' },
    description: desc('Update Subcategory', 'PUT', 'products/categories/subcategories/:id', true, null, '200 OK', { id: 'sub_123', name: 'Laptops Updated' }),
    responses: makeResponses(200, { id: 'sub_123', name: 'Laptops Updated' }, authErrors)
  }),
  makeRequest('Delete Subcategory (Admin)', 'DELETE', 'products/categories/subcategories/{{categoryId}}', {
    auth: true,
    description: desc('Delete Subcategory', 'DELETE', 'products/categories/subcategories/:id', true, null, '200 OK', { message: 'Subcategory deleted' }),
    responses: makeResponses(200, { message: 'Subcategory deleted' }, authErrors)
  }),
  makeRequest('Delete Category (Admin)', 'DELETE', 'products/categories/{{categoryId}}', {
    auth: true,
    description: desc('Delete Category', 'DELETE', 'products/categories/:id', true, null, '200 OK', { message: 'Category deleted' }),
    responses: makeResponses(200, { message: 'Category deleted' }, authErrors)
  }),
  // Exchange Rates
  makeRequest('List Exchange Rates', 'GET', 'products/exchange-rates', {
    auth: true,
    description: desc('List Exchange Rates', 'GET', 'products/exchange-rates', true, null, '200 OK', { rates: [] }),
    responses: makeResponses(200, { rates: [{ id: 'er_123', from: 'USD', to: 'CDF', rate: 2800 }] }, authErrors)
  }),
  makeRequest('Get Exchange Rate', 'GET', 'products/exchange-rates/{{transactionId}}', {
    auth: true,
    description: desc('Get Exchange Rate', 'GET', 'products/exchange-rates/:id', true, null, '200 OK', { id: 'er_123', from: 'USD', to: 'CDF', rate: 2800 }),
    responses: makeResponses(200, { id: 'er_123', from: 'USD', to: 'CDF', rate: 2800 }, authErrors)
  }),
  makeRequest('Create Exchange Rate', 'POST', 'products/exchange-rates', {
    auth: true, body: { from: 'USD', to: 'CDF', rate: 2800 },
    description: desc('Create Exchange Rate', 'POST', 'products/exchange-rates', true, null, '201 Created', { id: 'er_123', from: 'USD', to: 'CDF', rate: 2800 }),
    responses: makeResponses(201, { id: 'er_123', from: 'USD', to: 'CDF', rate: 2800 }, authErrors)
  }),
  makeRequest('Update Exchange Rate by ID', 'PUT', 'products/exchange-rates/{{transactionId}}', {
    auth: true, body: { rate: 2850 },
    description: desc('Update Exchange Rate by ID', 'PUT', 'products/exchange-rates/:id', true, null, '200 OK', { id: 'er_123', rate: 2850 }),
    responses: makeResponses(200, { id: 'er_123', rate: 2850 }, authErrors)
  }),
  makeRequest('Update Exchange Rate by Pair', 'PUT', 'products/exchange-rates', {
    auth: true, body: { from: 'USD', to: 'CDF', rate: 2850 },
    description: desc('Update Exchange Rate by Pair', 'PUT', 'products/exchange-rates', true, null, '200 OK', { from: 'USD', to: 'CDF', rate: 2850 }),
    responses: makeResponses(200, { from: 'USD', to: 'CDF', rate: 2850 }, authErrors)
  }),
  makeRequest('Delete Exchange Rate', 'DELETE', 'products/exchange-rates/{{transactionId}}', {
    auth: true,
    description: desc('Delete Exchange Rate', 'DELETE', 'products/exchange-rates/:id', true, null, '200 OK', { message: 'Exchange rate deleted' }),
    responses: makeResponses(200, { message: 'Exchange rate deleted' }, authErrors)
  }),
  makeRequest('Preview Exchange Rate', 'POST', 'products/exchange-rates/preview', {
    auth: true, body: { amount: 100, from: 'USD', to: 'CDF' },
    description: desc('Preview Exchange Rate', 'POST', 'products/exchange-rates/preview', true, null, '200 OK', { convertedAmount: 280000, rate: 2800 }),
    responses: makeResponses(200, { convertedAmount: 280000, rate: 2800 }, authErrors)
  }),
  // Seller products
  makeRequest('Create Product', 'POST', 'products', {
    auth: true,
    formdata: [
      { key: 'name', value: 'Awesome Product', type: 'text' },
      { key: 'description', value: 'A great product', type: 'text' },
      { key: 'price', value: '29.99', type: 'text' },
      { key: 'currency', value: 'USD', type: 'text' },
      { key: 'categoryId', value: '{{categoryId}}', type: 'text' },
      { key: 'shopId', value: '{{shopId}}', type: 'text' },
      { key: 'images', type: 'file', src: '/path/to/image1.jpg' }
    ],
    description: desc('Create Product', 'POST', 'products', true, null, '201 Created', { id: 'prod_123', name: 'Awesome Product' }),
    events: testSaveId('productId'),
    responses: makeResponses(201, { id: 'prod_123', name: 'Awesome Product' }, authErrors)
  }),
  makeRequest('Get Shop Products', 'GET', 'products/shop/{{shopId}}', {
    auth: true,
    description: desc('Get Shop Products', 'GET', 'products/shop/:shopId', true, null, '200 OK', { products: [] }),
    responses: makeResponses(200, { products: [] }, authErrors)
  }),
  makeRequest('Update Product', 'PUT', 'products/{{productId}}', {
    auth: true, body: { name: 'Updated Product', price: 39.99 },
    description: desc('Update Product', 'PUT', 'products/:id', true, null, '200 OK', { id: 'prod_123', name: 'Updated Product' }),
    responses: makeResponses(200, { id: 'prod_123', name: 'Updated Product' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Update Product Status', 'POST', 'products/{{productId}}/status', {
    auth: true, body: { status: 'ACTIVE' },
    description: desc('Update Product Status', 'POST', 'products/:id/status', true, null, '200 OK', { message: 'Status updated' }),
    responses: makeResponses(200, { message: 'Status updated' }, authErrors)
  }),
  // Reviews
  makeRequest('Create Review', 'POST', 'products/{{productId}}/reviews', {
    auth: true, body: { rating: 5, comment: 'Great product!', orderId: '{{orderId}}' },
    description: desc('Create Review', 'POST', 'products/:productId/reviews', true, null, '201 Created', { id: 'rev_123', rating: 5 }),
    events: testSaveId('reviewId'),
    responses: makeResponses(201, { id: 'rev_123', rating: 5 }, authErrors)
  }),
  // Stock
  makeRequest('Update Stock', 'POST', 'products/variants/{{variantId}}/stock', {
    auth: true, body: { quantity: 50, reason: 'Restock' },
    description: desc('Update Stock', 'POST', 'products/variants/:variantId/stock', true, null, '200 OK', { quantity: 50 }),
    responses: makeResponses(200, { quantity: 50 }, authErrors)
  }),
  makeRequest('Get Stock History', 'GET', 'products/variants/{{variantId}}/stock/history', {
    auth: true,
    description: desc('Get Stock History', 'GET', 'products/variants/:variantId/stock/history', true, null, '200 OK', { history: [] }),
    responses: makeResponses(200, { history: [] }, authErrors)
  }),
  // Admin products
  makeRequest('List Products (Admin)', 'GET', 'products/admin', {
    auth: true,
    description: desc('List Products (Admin)', 'GET', 'products/admin', true, null, '200 OK', { products: [] }),
    responses: makeResponses(200, { products: [] }, authErrors)
  }),
  makeRequest('Get Product (Admin)', 'GET', 'products/admin/{{productId}}', {
    auth: true,
    description: desc('Get Product (Admin)', 'GET', 'products/admin/:id', true, null, '200 OK', { id: 'prod_123' }),
    responses: makeResponses(200, { id: 'prod_123', name: 'Product' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Admin Update Product Status', 'POST', 'products/admin/{{productId}}/status', {
    auth: true,
    description: desc('Admin Update Product Status', 'POST', 'products/admin/:id/status', true, null, '200 OK', { message: 'Status updated' }),
    responses: makeResponses(200, { message: 'Status updated' }, authErrors)
  })
];
collection.item.push(makeFolder('Products', productItems));

// ============ CART ============
const cartItems = [
  makeRequest('Add to Cart', 'POST', 'cart/items', {
    auth: true, body: { productId: '{{productId}}', variantId: '{{variantId}}', shopId: '{{shopId}}', quantity: 2 },
    description: desc('Add to Cart', 'POST', 'cart/items', true, null, '201 Created', { id: 'item_123', productId: 'prod_123', quantity: 2 }),
    events: testSaveId('itemId'),
    responses: makeResponses(201, { id: 'item_123', quantity: 2 }, authErrors)
  }),
  makeRequest('Update Cart Item', 'PUT', 'cart/items/{{itemId}}', {
    auth: true, body: { quantity: 3 },
    description: desc('Update Cart Item', 'PUT', 'cart/items/:itemId', true, null, '200 OK', { id: 'item_123', quantity: 3 }),
    responses: makeResponses(200, { id: 'item_123', quantity: 3 }, authErrors)
  }),
  makeRequest('Remove Cart Item', 'DELETE', 'cart/items/{{itemId}}', {
    auth: true,
    description: desc('Remove Cart Item', 'DELETE', 'cart/items/:itemId', true, null, '200 OK', { message: 'Item removed' }),
    responses: makeResponses(200, { message: 'Item removed' }, authErrors)
  }),
  makeRequest('Get Cart', 'GET', 'cart', {
    auth: true,
    description: desc('Get Cart', 'GET', 'cart', true, null, '200 OK', { items: [], total: 0 }),
    responses: makeResponses(200, { items: [], total: 0 }, authErrors)
  }),
  makeRequest('Get Cart by Shop', 'GET', 'cart/shop/{{shopId}}', {
    auth: true,
    description: desc('Get Cart by Shop', 'GET', 'cart/shop/:shopId', true, null, '200 OK', { items: [] }),
    responses: makeResponses(200, { items: [] }, authErrors)
  }),
  makeRequest('Clear Cart by Shop', 'POST', 'cart/shop/{{shopId}}/clear', {
    auth: true,
    description: desc('Clear Cart by Shop', 'POST', 'cart/shop/:shopId/clear', true, null, '200 OK', { message: 'Cart cleared' }),
    responses: makeResponses(200, { message: 'Cart cleared' }, authErrors)
  })
];
collection.item.push(makeFolder('Cart', cartItems));

// ============ ORDERS ============
const orderItems = [
  makeRequest('Checkout', 'POST', 'orders/checkout', {
    auth: true, body: { shopId: '{{shopId}}', deliveryAddress: '123 Main St, Goma', deliveryMethod: 'DELIVERY', paymentMethod: 'MOBILE_MONEY', phoneNumber: '+243999000111', note: 'Leave at door', currency: 'USD' },
    description: desc('Checkout', 'POST', 'orders/checkout', true, null, '201 Created', { id: 'ord_123', status: 'PENDING' }),
    events: testSaveId('orderId'),
    responses: makeResponses(201, { id: 'ord_123', status: 'PENDING' }, authErrors)
  }),
  makeRequest('Get My Orders', 'GET', 'orders/me', {
    auth: true,
    description: desc('Get My Orders', 'GET', 'orders/me', true, null, '200 OK', { orders: [] }),
    responses: makeResponses(200, { orders: [] }, authErrors)
  }),
  makeRequest('Cancel Order', 'POST', 'orders/{{orderId}}/cancel', {
    auth: true,
    description: desc('Cancel Order', 'POST', 'orders/:id/cancel', true, null, '200 OK', { message: 'Order cancelled' }),
    responses: makeResponses(200, { message: 'Order cancelled' }, authErrors)
  }),
  makeRequest('Confirm Receipt', 'POST', 'orders/{{orderId}}/confirm-receipt', {
    auth: true,
    description: desc('Confirm Receipt', 'POST', 'orders/:id/confirm-receipt', true, null, '200 OK', { message: 'Receipt confirmed' }),
    responses: makeResponses(200, { message: 'Receipt confirmed' }, authErrors)
  }),
  makeRequest('Get Order QR Code', 'GET', 'orders/{{orderId}}/qr-code', {
    auth: true,
    description: desc('Get Order QR Code', 'GET', 'orders/:id/qr-code', true, null, '200 OK', { qrCode: 'data:image/png;base64,...', token: 'qr_token_123' }),
    responses: makeResponses(200, { qrCode: 'data:image/png;base64,...', token: 'qr_token_123' }, authErrors)
  }),
  makeRequest('Get Order Messages', 'GET', 'orders/{{orderId}}/messages', {
    auth: true,
    description: desc('Get Order Messages', 'GET', 'orders/:id/messages', true, null, '200 OK', { messages: [] }),
    responses: makeResponses(200, { messages: [] }, authErrors)
  }),
  makeRequest('Send Order Message', 'POST', 'orders/{{orderId}}/messages', {
    auth: true, body: { content: 'Hello, when will my order be ready?' },
    description: desc('Send Order Message', 'POST', 'orders/:id/messages', true, null, '201 Created', { id: 'msg_123', content: 'Hello' }),
    responses: makeResponses(201, { id: 'msg_123', content: 'Hello' }, authErrors)
  }),
  makeRequest('Mark Messages Read', 'POST', 'orders/{{orderId}}/messages/read', {
    auth: true,
    description: desc('Mark Messages Read', 'POST', 'orders/:id/messages/read', true, null, '200 OK', { message: 'Messages marked read' }),
    responses: makeResponses(200, { message: 'Messages marked read' }, authErrors)
  }),
  makeRequest('Scan Order QR', 'POST', 'orders/scan', {
    auth: true, body: { qrToken: 'qr_token_123' },
    description: desc('Scan Order QR', 'POST', 'orders/scan', true, null, '200 OK', { order: { id: 'ord_123' } }),
    responses: makeResponses(200, { order: { id: 'ord_123' } }, authErrors)
  }),
  // Seller
  makeRequest('Accept Order', 'POST', 'orders/{{orderId}}/accept', {
    auth: true,
    description: desc('Accept Order', 'POST', 'orders/:id/accept', true, null, '200 OK', { message: 'Order accepted' }),
    responses: makeResponses(200, { message: 'Order accepted' }, authErrors)
  }),
  makeRequest('Reject Order', 'POST', 'orders/{{orderId}}/reject', {
    auth: true, body: { reason: 'Out of stock' },
    description: desc('Reject Order', 'POST', 'orders/:id/reject', true, null, '200 OK', { message: 'Order rejected' }),
    responses: makeResponses(200, { message: 'Order rejected' }, authErrors)
  }),
  makeRequest('Mark Order Ready', 'POST', 'orders/{{orderId}}/ready', {
    auth: true,
    description: desc('Mark Order Ready', 'POST', 'orders/:id/ready', true, null, '200 OK', { message: 'Order ready' }),
    responses: makeResponses(200, { message: 'Order ready' }, authErrors)
  }),
  makeRequest('Complete Pickup', 'POST', 'orders/{{orderId}}/complete-pickup', {
    auth: true,
    description: desc('Complete Pickup', 'POST', 'orders/:id/complete-pickup', true, null, '200 OK', { message: 'Pickup completed' }),
    responses: makeResponses(200, { message: 'Pickup completed' }, authErrors)
  }),
  makeRequest('Assign Rider', 'POST', 'orders/{{orderId}}/assign-rider', {
    auth: true, body: { riderId: '{{riderId}}' },
    description: desc('Assign Rider', 'POST', 'orders/:id/assign-rider', true, null, '200 OK', { message: 'Rider assigned' }),
    responses: makeResponses(200, { message: 'Rider assigned' }, authErrors)
  }),
  makeRequest('Get Shop Orders', 'GET', 'orders/shop/{{shopId}}', {
    auth: true,
    description: desc('Get Shop Orders', 'GET', 'orders/shop/:shopId', true, null, '200 OK', { orders: [] }),
    responses: makeResponses(200, { orders: [] }, authErrors)
  }),
  // Rider
  makeRequest('Mark Picked Up', 'POST', 'orders/{{orderId}}/picked-up', {
    auth: true,
    description: desc('Mark Picked Up', 'POST', 'orders/:id/picked-up', true, null, '200 OK', { message: 'Order picked up' }),
    responses: makeResponses(200, { message: 'Order picked up' }, authErrors)
  }),
  makeRequest('Mark On The Way', 'POST', 'orders/{{orderId}}/on-the-way', {
    auth: true,
    description: desc('Mark On The Way', 'POST', 'orders/:id/on-the-way', true, null, '200 OK', { message: 'Order on the way' }),
    responses: makeResponses(200, { message: 'Order on the way' }, authErrors)
  }),
  makeRequest('Complete Delivery', 'POST', 'orders/{{orderId}}/complete-delivery', {
    auth: true,
    description: desc('Complete Delivery', 'POST', 'orders/:id/complete-delivery', true, null, '200 OK', { message: 'Delivery completed' }),
    responses: makeResponses(200, { message: 'Delivery completed' }, authErrors)
  }),
  makeRequest('Failed Delivery', 'POST', 'orders/{{orderId}}/failed-delivery', {
    auth: true, body: { reason: 'Customer not available' },
    description: desc('Failed Delivery', 'POST', 'orders/:id/failed-delivery', true, null, '200 OK', { message: 'Delivery marked failed' }),
    responses: makeResponses(200, { message: 'Delivery marked failed' }, authErrors)
  }),
  makeRequest('Get Rider Orders', 'GET', 'orders/rider/me', {
    auth: true,
    description: desc('Get Rider Orders', 'GET', 'orders/rider/me', true, null, '200 OK', { orders: [] }),
    responses: makeResponses(200, { orders: [] }, authErrors)
  }),
  makeRequest('Get Order by ID', 'GET', 'orders/{{orderId}}', {
    auth: true,
    description: desc('Get Order by ID', 'GET', 'orders/:id', true, null, '200 OK', { id: 'ord_123', status: 'PENDING' }),
    responses: makeResponses(200, { id: 'ord_123', status: 'PENDING' }, [...authErrors, ...notFoundErrors])
  })
];
collection.item.push(makeFolder('Orders', orderItems));

// ============ ADMIN ORDERS ============
const adminOrderItems = [
  makeRequest('List Orders (Admin)', 'GET', 'orders/admin', {
    auth: true,
    description: desc('List Orders (Admin)', 'GET', 'orders/admin', true, null, '200 OK', { orders: [] }),
    responses: makeResponses(200, { orders: [] }, authErrors)
  }),
  makeRequest('Get Order (Admin)', 'GET', 'orders/admin/{{orderId}}', {
    auth: true,
    description: desc('Get Order (Admin)', 'GET', 'orders/admin/:id', true, null, '200 OK', { id: 'ord_123' }),
    responses: makeResponses(200, { id: 'ord_123' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Cancel Order (Admin)', 'POST', 'orders/admin/{{orderId}}/cancel', {
    auth: true,
    description: desc('Cancel Order (Admin)', 'POST', 'orders/admin/:id/cancel', true, null, '200 OK', { message: 'Order cancelled' }),
    responses: makeResponses(200, { message: 'Order cancelled' }, authErrors)
  }),
  makeRequest('Request Refund Approval', 'POST', 'orders/admin/{{orderId}}/refund/request-approval', {
    auth: true,
    description: desc('Request Refund Approval', 'POST', 'orders/admin/:id/refund/request-approval', true, null, '200 OK', { message: 'OTP sent' }),
    responses: makeResponses(200, { message: 'OTP sent' }, authErrors)
  }),
  makeRequest('Confirm Refund', 'POST', 'orders/admin/{{orderId}}/refund/confirm', {
    auth: true, body: { otpCode: '123456' },
    description: desc('Confirm Refund', 'POST', 'orders/admin/:id/refund/confirm', true, null, '200 OK', { message: 'Refund confirmed' }),
    responses: makeResponses(200, { message: 'Refund confirmed' }, authErrors)
  }),
  makeRequest('Direct Refund', 'POST', 'orders/admin/{{orderId}}/refund', {
    auth: true,
    description: desc('Direct Refund', 'POST', 'orders/admin/:id/refund', true, null, '200 OK', { message: 'Refund processed' }),
    responses: makeResponses(200, { message: 'Refund processed' }, authErrors)
  })
];
collection.item.push(makeFolder('Admin Orders', adminOrderItems));

// ============ PAWAPAY ============
const pawapayItems = [
  makeRequest('Create Deposit', 'POST', 'pawapay/deposits', {
    auth: true, body: { amount: '10.00', currency: 'USD', phoneNumber: '+243999000111', description: 'Order payment', correspondent: 'MTN_MOMO_COD' },
    description: desc('Create Deposit', 'POST', 'pawapay/deposits', true, null, '201 Created', { depositId: 'dep_123', status: 'PENDING' }),
    events: testSaveId('depositId', 'depositId'),
    responses: makeResponses(201, { depositId: 'dep_123', status: 'PENDING' }, authErrors)
  }),
  makeRequest('Get Deposit', 'GET', 'pawapay/deposits/{{depositId}}', {
    auth: true,
    description: desc('Get Deposit', 'GET', 'pawapay/deposits/:depositId', true, null, '200 OK', { depositId: 'dep_123', status: 'COMPLETED' }),
    responses: makeResponses(200, { depositId: 'dep_123', status: 'COMPLETED' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Request Payout Approval', 'POST', 'pawapay/payouts/request-approval', {
    auth: true, body: { amount: '10.00', currency: 'USD', phoneNumber: '+243999000111', description: 'Payout', correspondent: 'MTN_MOMO_COD' },
    description: desc('Request Payout Approval', 'POST', 'pawapay/payouts/request-approval', true, null, '200 OK', { payoutId: 'pay_123', message: 'OTP sent' }),
    events: testSaveId('payoutId', 'payoutId'),
    responses: makeResponses(200, { payoutId: 'pay_123', message: 'OTP sent' }, authErrors)
  }),
  makeRequest('Confirm Payout', 'POST', 'pawapay/payouts/confirm', {
    auth: true, body: { otpCode: '123456', payoutId: '{{payoutId}}' },
    description: desc('Confirm Payout', 'POST', 'pawapay/payouts/confirm', true, null, '200 OK', { message: 'Payout confirmed' }),
    responses: makeResponses(200, { message: 'Payout confirmed' }, authErrors)
  }),
  makeRequest('Payout History', 'GET', 'pawapay/payouts/history', {
    auth: true,
    description: desc('Payout History', 'GET', 'pawapay/payouts/history', true, null, '200 OK', { payouts: [] }),
    responses: makeResponses(200, { payouts: [] }, authErrors)
  }),
  makeRequest('Get Payout', 'GET', 'pawapay/payouts/{{payoutId}}', {
    auth: true,
    description: desc('Get Payout', 'GET', 'pawapay/payouts/:payoutId', true, null, '200 OK', { payoutId: 'pay_123' }),
    responses: makeResponses(200, { payoutId: 'pay_123', status: 'COMPLETED' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Request Refund Approval', 'POST', 'pawapay/refunds/request-approval', {
    auth: true, body: { depositId: '{{depositId}}', amount: 5.00 },
    description: desc('Request Refund Approval', 'POST', 'pawapay/refunds/request-approval', true, null, '200 OK', { refundId: 'ref_123', message: 'OTP sent' }),
    events: testSaveId('refundId', 'refundId'),
    responses: makeResponses(200, { refundId: 'ref_123', message: 'OTP sent' }, authErrors)
  }),
  makeRequest('Confirm Refund', 'POST', 'pawapay/refunds/confirm', {
    auth: true, body: { otpCode: '123456', refundId: '{{refundId}}' },
    description: desc('Confirm Refund', 'POST', 'pawapay/refunds/confirm', true, null, '200 OK', { message: 'Refund confirmed' }),
    responses: makeResponses(200, { message: 'Refund confirmed' }, authErrors)
  }),
  makeRequest('Direct Refund', 'POST', 'pawapay/refunds', {
    auth: true, body: { depositId: '{{depositId}}', amount: 5.00 },
    description: desc('Direct Refund', 'POST', 'pawapay/refunds', true, null, '200 OK', { refundId: 'ref_123' }),
    responses: makeResponses(200, { refundId: 'ref_123' }, authErrors)
  }),
  makeRequest('Get Refund', 'GET', 'pawapay/refunds/{{refundId}}', {
    auth: true,
    description: desc('Get Refund', 'GET', 'pawapay/refunds/:refundId', true, null, '200 OK', { refundId: 'ref_123' }),
    responses: makeResponses(200, { refundId: 'ref_123', status: 'COMPLETED' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Get Wallet Balances', 'GET', 'pawapay/wallet-balances', {
    auth: true,
    description: desc('Get Wallet Balances', 'GET', 'pawapay/wallet-balances', true, null, '200 OK', { balances: [] }),
    responses: makeResponses(200, { balances: [{ currency: 'USD', amount: '1000.00' }] }, authErrors)
  }),
  makeRequest('Get Active Configuration', 'GET', 'pawapay/active-configuration', {
    auth: true,
    description: desc('Get Active Configuration', 'GET', 'pawapay/active-configuration', true, null, '200 OK', { correspondents: [] }),
    responses: makeResponses(200, { correspondents: [{ name: 'MTN_MOMO_COD', country: 'COD' }] }, authErrors)
  }),
  // Callbacks
  makeRequest('Deposit Callback', 'POST', 'pawapay/callbacks/deposit', {
    body: { depositId: 'dep_123', status: 'COMPLETED' },
    description: desc('Deposit Callback', 'POST', 'pawapay/callbacks/deposit', false, null, '200 OK', { received: true }),
    responses: makeResponses(200, { received: true })
  }),
  makeRequest('Payout Callback', 'POST', 'pawapay/callbacks/payout', {
    body: { payoutId: 'pay_123', status: 'COMPLETED' },
    description: desc('Payout Callback', 'POST', 'pawapay/callbacks/payout', false, null, '200 OK', { received: true }),
    responses: makeResponses(200, { received: true })
  })
];
collection.item.push(makeFolder('PawaPay', pawapayItems));

// ============ MBIYOPAY ============
const mbiyopayItems = [
  makeRequest('Create Payin', 'POST', 'mbiyopay/payin', {
    auth: true, body: { amount: 10.00, currency: 'USD', phoneNumber: '+243999000111', provider: 'MTN' },
    description: desc('Create Payin', 'POST', 'mbiyopay/payin', true, null, '201 Created', { transactionId: 'txn_123', status: 'PENDING' }),
    events: testSaveId('transactionId', 'transactionId'),
    responses: makeResponses(201, { transactionId: 'txn_123', status: 'PENDING' }, authErrors)
  }),
  makeRequest('Request Payout Approval', 'POST', 'mbiyopay/payout/request-approval', {
    auth: true, body: { amount: 10.00, currency: 'USD', phoneNumber: '+243999000111', provider: 'MTN' },
    description: desc('Request Payout Approval', 'POST', 'mbiyopay/payout/request-approval', true, null, '200 OK', { payoutId: 'pay_123', message: 'OTP sent' }),
    events: testSaveId('payoutId', 'payoutId'),
    responses: makeResponses(200, { payoutId: 'pay_123', message: 'OTP sent' }, authErrors)
  }),
  makeRequest('Confirm Payout', 'POST', 'mbiyopay/payout/confirm', {
    auth: true, body: { otpCode: '123456', payoutId: '{{payoutId}}' },
    description: desc('Confirm Payout', 'POST', 'mbiyopay/payout/confirm', true, null, '200 OK', { message: 'Payout confirmed' }),
    responses: makeResponses(200, { message: 'Payout confirmed' }, authErrors)
  }),
  makeRequest('Payout History', 'GET', 'mbiyopay/payout/history', {
    auth: true,
    description: desc('Payout History', 'GET', 'mbiyopay/payout/history', true, null, '200 OK', { payouts: [] }),
    responses: makeResponses(200, { payouts: [] }, authErrors)
  }),
  makeRequest('Get Transaction', 'GET', 'mbiyopay/transactions/{{transactionId}}', {
    auth: true,
    description: desc('Get Transaction', 'GET', 'mbiyopay/transactions/:transactionId', true, null, '200 OK', { transactionId: 'txn_123' }),
    responses: makeResponses(200, { transactionId: 'txn_123', status: 'COMPLETED' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Get Balances', 'GET', 'mbiyopay/balances', {
    auth: true,
    description: desc('Get Balances', 'GET', 'mbiyopay/balances', true, null, '200 OK', { balances: [] }),
    responses: makeResponses(200, { balances: [{ currency: 'USD', amount: 500 }] }, authErrors)
  }),
  makeRequest('Get Network Balances', 'GET', 'mbiyopay/balances/networks', {
    auth: true,
    description: desc('Get Network Balances', 'GET', 'mbiyopay/balances/networks', true, null, '200 OK', { networks: [] }),
    responses: makeResponses(200, { networks: [] }, authErrors)
  }),
  makeRequest('Get Countries', 'GET', 'mbiyopay/countries', {
    auth: true,
    description: desc('Get Countries', 'GET', 'mbiyopay/countries', true, null, '200 OK', { countries: [] }),
    responses: makeResponses(200, { countries: [{ code: 'COD', name: 'DR Congo' }] }, authErrors)
  }),
  makeRequest('MbiyoPay Callback', 'POST', 'mbiyopay/callbacks', {
    body: { transactionId: 'txn_123', status: 'COMPLETED' },
    description: desc('MbiyoPay Callback', 'POST', 'mbiyopay/callbacks', false, null, '200 OK', { received: true }),
    responses: makeResponses(200, { received: true })
  })
];
collection.item.push(makeFolder('MbiyoPay', mbiyopayItems));

// ============ ADMIN TRANSACTIONS ============
collection.item.push(makeFolder('Admin Transactions', [
  makeRequest('List Transactions', 'GET', 'payments/transactions', {
    auth: true,
    description: desc('List Transactions', 'GET', 'payments/transactions', true, null, '200 OK', { transactions: [] }),
    responses: makeResponses(200, { transactions: [] }, authErrors)
  })
]));

// ============ PAYMENT LEDGER ============
collection.item.push(makeFolder('Payment Ledger', [
  makeRequest('Get Ledger', 'GET', 'payments/ledger', {
    auth: true,
    description: desc('Get Ledger', 'GET', 'payments/ledger', true, null, '200 OK', { entries: [] }),
    responses: makeResponses(200, { entries: [] }, authErrors)
  }),
  makeRequest('Export Ledger CSV', 'GET', 'payments/ledger/export/csv', {
    auth: true,
    description: desc('Export Ledger CSV', 'GET', 'payments/ledger/export/csv', true, null, '200 OK', null),
    responses: makeResponses(200, { url: 'https://cdn.example.com/ledger.csv' }, authErrors)
  })
]));

// ============ WALLET ============
collection.item.push(makeFolder('Wallet', [
  makeRequest('Get My Wallet', 'GET', 'wallet/me', {
    auth: true,
    description: desc('Get My Wallet', 'GET', 'wallet/me', true, null, '200 OK', { id: 'wal_123', balance: 100, currency: 'USD' }),
    responses: makeResponses(200, { id: 'wal_123', balance: 100, currency: 'USD' }, authErrors)
  }),
  makeRequest('Get Wallet Transactions', 'GET', 'wallet/me/transactions', {
    auth: true,
    description: desc('Get Wallet Transactions', 'GET', 'wallet/me/transactions', true, null, '200 OK', { transactions: [] }),
    responses: makeResponses(200, { transactions: [] }, authErrors)
  }),
  makeRequest('Request Payout OTP', 'POST', 'wallet/payout/otp', {
    auth: true,
    description: desc('Request Payout OTP', 'POST', 'wallet/payout/otp', true, null, '200 OK', { message: 'OTP sent' }),
    responses: makeResponses(200, { message: 'OTP sent' }, authErrors)
  }),
  makeRequest('Wallet Payout', 'POST', 'wallet/payout', {
    auth: true, body: { amount: 50, currency: 'USD', phoneNumber: '+243999000111', provider: 'MTN', otpCode: '123456' },
    description: desc('Wallet Payout', 'POST', 'wallet/payout', true, null, '200 OK', { message: 'Payout initiated' }),
    responses: makeResponses(200, { message: 'Payout initiated' }, authErrors)
  })
]));

// ============ WALLET SETTINGS ============
collection.item.push(makeFolder('Wallet Settings', [
  makeRequest('Create Wallet Settings', 'POST', 'wallet-settings', {
    auth: true, body: { payoutPhoneNumber: '+243999000111', payoutProvider: 'MTN', autoPayoutEnabled: true, autoPayoutThreshold: 100, autoPayoutCurrency: 'USD' },
    description: desc('Create Wallet Settings', 'POST', 'wallet-settings', true, null, '201 Created', { id: 'ws_123' }),
    responses: makeResponses(201, { id: 'ws_123', autoPayoutEnabled: true }, authErrors)
  }),
  makeRequest('Get My Wallet Settings', 'GET', 'wallet-settings/me', {
    auth: true,
    description: desc('Get My Wallet Settings', 'GET', 'wallet-settings/me', true, null, '200 OK', { id: 'ws_123' }),
    responses: makeResponses(200, { id: 'ws_123', payoutPhoneNumber: '+243999000111' }, authErrors)
  }),
  makeRequest('Update Wallet Settings', 'PUT', 'wallet-settings', {
    auth: true, body: { payoutPhoneNumber: '+243999000222', autoPayoutEnabled: false },
    description: desc('Update Wallet Settings', 'PUT', 'wallet-settings', true, null, '200 OK', { message: 'Settings updated' }),
    responses: makeResponses(200, { message: 'Settings updated' }, authErrors)
  })
]));

// ============ NOTIFICATIONS ============
collection.item.push(makeFolder('Notifications', [
  makeRequest('Get Notifications', 'GET', 'notifications', {
    auth: true,
    description: desc('Get Notifications', 'GET', 'notifications', true, null, '200 OK', { notifications: [] }),
    responses: makeResponses(200, { notifications: [] }, authErrors)
  }),
  makeRequest('Mark All Read', 'POST', 'notifications/read-all', {
    auth: true,
    description: desc('Mark All Read', 'POST', 'notifications/read-all', true, null, '200 OK', { message: 'All marked read' }),
    responses: makeResponses(200, { message: 'All marked read' }, authErrors)
  }),
  makeRequest('Get Preferences', 'GET', 'notifications/preferences', {
    auth: true,
    description: desc('Get Notification Preferences', 'GET', 'notifications/preferences', true, null, '200 OK', { preferences: [] }),
    responses: makeResponses(200, { preferences: [] }, authErrors)
  }),
  makeRequest('Update Preferences', 'PUT', 'notifications/preferences', {
    auth: true, body: { channel: 'EMAIL', type: 'ORDER_UPDATE', enabled: true },
    description: desc('Update Notification Preferences', 'PUT', 'notifications/preferences', true, null, '200 OK', { message: 'Preference updated' }),
    responses: makeResponses(200, { message: 'Preference updated' }, authErrors)
  }),
  makeRequest('Create Notification (Admin)', 'POST', 'notifications', {
    auth: true, body: { title: 'System Update', message: 'Scheduled maintenance tonight', targetRole: 'ALL', targetUserId: null },
    description: desc('Create Notification', 'POST', 'notifications', true, null, '201 Created', { id: 'notif_123' }),
    events: testSaveId('notificationId'),
    responses: makeResponses(201, { id: 'notif_123' }, authErrors)
  }),
  makeRequest('Mark Notification Read', 'POST', 'notifications/{{notificationId}}/read', {
    auth: true,
    description: desc('Mark Notification Read', 'POST', 'notifications/:id/read', true, null, '200 OK', { message: 'Marked read' }),
    responses: makeResponses(200, { message: 'Marked read' }, authErrors)
  }),
  makeRequest('Delete Notification', 'DELETE', 'notifications/{{notificationId}}', {
    auth: true,
    description: desc('Delete Notification', 'DELETE', 'notifications/:id', true, null, '200 OK', { message: 'Notification deleted' }),
    responses: makeResponses(200, { message: 'Notification deleted' }, authErrors)
  })
]));

// ============ FAVORITES ============
collection.item.push(makeFolder('Favorites', [
  makeRequest('Get Favorites', 'GET', 'favorites', {
    auth: true,
    description: desc('Get Favorites', 'GET', 'favorites', true, null, '200 OK', { favorites: [] }),
    responses: makeResponses(200, { favorites: [] }, authErrors)
  }),
  makeRequest('Get Favorite IDs', 'GET', 'favorites/ids', {
    auth: true,
    description: desc('Get Favorite IDs', 'GET', 'favorites/ids', true, null, '200 OK', { ids: [] }),
    responses: makeResponses(200, { ids: ['prod_123', 'prod_456'] }, authErrors)
  }),
  makeRequest('Add Favorite', 'POST', 'favorites/{{productId}}', {
    auth: true,
    description: desc('Add Favorite', 'POST', 'favorites/:productId', true, null, '201 Created', { message: 'Added to favorites' }),
    responses: makeResponses(201, { message: 'Added to favorites' }, authErrors)
  }),
  makeRequest('Remove Favorite', 'DELETE', 'favorites/{{productId}}', {
    auth: true,
    description: desc('Remove Favorite', 'DELETE', 'favorites/:productId', true, null, '200 OK', { message: 'Removed from favorites' }),
    responses: makeResponses(200, { message: 'Removed from favorites' }, authErrors)
  })
]));

// ============ BLOG ============
collection.item.push(makeFolder('Blog', [
  makeRequest('List Blog Posts (Public)', 'GET', 'blog', {
    description: desc('List Blog Posts', 'GET', 'blog', false, null, '200 OK', { posts: [] }),
    responses: makeResponses(200, { posts: [] })
  }),
  makeRequest('Get Blog Post by Slug (Public)', 'GET', 'blog/slug/my-blog-post', {
    description: desc('Get Blog Post by Slug', 'GET', 'blog/slug/:slug', false, null, '200 OK', { id: 'bp_123', title: 'My Blog Post' }),
    responses: makeResponses(200, { id: 'bp_123', title: 'My Blog Post' }, notFoundErrors)
  }),
  makeRequest('List Blog Posts (Admin)', 'GET', 'blog/admin', {
    auth: true,
    description: desc('List Blog Posts (Admin)', 'GET', 'blog/admin', true, null, '200 OK', { posts: [] }),
    responses: makeResponses(200, { posts: [] }, authErrors)
  }),
  makeRequest('Get Blog Post (Admin)', 'GET', 'blog/admin/{{blogPostId}}', {
    auth: true,
    description: desc('Get Blog Post (Admin)', 'GET', 'blog/admin/:id', true, null, '200 OK', { id: 'bp_123' }),
    responses: makeResponses(200, { id: 'bp_123', title: 'My Blog Post' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Create Blog Post', 'POST', 'blog', {
    auth: true,
    formdata: [
      { key: 'title', value: 'New Blog Post', type: 'text' },
      { key: 'slug', value: 'new-blog-post', type: 'text' },
      { key: 'content', value: 'This is the blog content...', type: 'text' },
      { key: 'excerpt', value: 'Short excerpt', type: 'text' },
      { key: 'status', value: 'DRAFT', type: 'text' },
      { key: 'coverImage', type: 'file', src: '/path/to/cover.jpg' }
    ],
    description: desc('Create Blog Post', 'POST', 'blog', true, null, '201 Created', { id: 'bp_123', title: 'New Blog Post' }),
    events: testSaveId('blogPostId'),
    responses: makeResponses(201, { id: 'bp_123', title: 'New Blog Post' }, authErrors)
  }),
  makeRequest('Update Blog Post', 'PUT', 'blog/{{blogPostId}}', {
    auth: true,
    formdata: [
      { key: 'title', value: 'Updated Blog Post', type: 'text' },
      { key: 'content', value: 'Updated content...', type: 'text' },
      { key: 'coverImage', type: 'file', src: '/path/to/cover.jpg' }
    ],
    description: desc('Update Blog Post', 'PUT', 'blog/:id', true, null, '200 OK', { id: 'bp_123', title: 'Updated Blog Post' }),
    responses: makeResponses(200, { id: 'bp_123', title: 'Updated Blog Post' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Delete Blog Post', 'DELETE', 'blog/{{blogPostId}}', {
    auth: true,
    description: desc('Delete Blog Post', 'DELETE', 'blog/:id', true, null, '200 OK', { message: 'Blog post deleted' }),
    responses: makeResponses(200, { message: 'Blog post deleted' }, authErrors)
  })
]));

// ============ DASHBOARD ============
collection.item.push(makeFolder('Dashboard', [
  makeRequest('Support Overview', 'GET', 'dashboard/support-overview', {
    auth: true,
    description: desc('Support Overview', 'GET', 'dashboard/support-overview', true, null, '200 OK', { openTickets: 5, resolvedToday: 12 }),
    responses: makeResponses(200, { openTickets: 5, resolvedToday: 12 }, authErrors)
  }),
  makeRequest('Support Metrics', 'GET', 'dashboard/support-metrics', {
    auth: true,
    description: desc('Support Metrics', 'GET', 'dashboard/support-metrics', true, null, '200 OK', { avgResponseTime: 120 }),
    responses: makeResponses(200, { avgResponseTime: 120 }, authErrors)
  }),
  makeRequest('Accountant Overview', 'GET', 'dashboard/accountant-overview', {
    auth: true,
    description: desc('Accountant Overview', 'GET', 'dashboard/accountant-overview', true, null, '200 OK', { revenue: 50000, expenses: 20000 }),
    responses: makeResponses(200, { revenue: 50000, expenses: 20000 }, authErrors)
  }),
  makeRequest('Dashboard Overview', 'GET', 'dashboard/overview', {
    auth: true,
    description: desc('Dashboard Overview', 'GET', 'dashboard/overview', true, null, '200 OK', { totalOrders: 100, totalRevenue: 5000 }),
    responses: makeResponses(200, { totalOrders: 100, totalRevenue: 5000 }, authErrors)
  }),
  makeRequest('Dashboard Metrics', 'GET', 'dashboard/metrics', {
    auth: true,
    description: desc('Dashboard Metrics', 'GET', 'dashboard/metrics', true, null, '200 OK', { dailyOrders: 10 }),
    responses: makeResponses(200, { dailyOrders: 10 }, authErrors)
  })
]));

// ============ SUPPORT ============
collection.item.push(makeFolder('Support', [
  makeRequest('Submit Contact Message', 'POST', 'support/contact', {
    body: { name: 'Jane Doe', email: 'jane@example.com', phone: '+243999000111', subject: 'Help needed', message: 'I have an issue with my order' },
    description: desc('Submit Contact Message', 'POST', 'support/contact', false, null, '201 Created', { id: 'msg_123', message: 'Message sent' }),
    events: testSaveId('contactMessageId'),
    responses: makeResponses(201, { id: 'msg_123', message: 'Message sent' }, validationErrors)
  }),
  makeRequest('List Support Messages (Admin)', 'GET', 'support/messages', {
    auth: true,
    description: desc('List Support Messages', 'GET', 'support/messages', true, null, '200 OK', { messages: [] }),
    responses: makeResponses(200, { messages: [] }, authErrors)
  }),
  makeRequest('Get Support Message (Admin)', 'GET', 'support/messages/{{contactMessageId}}', {
    auth: true,
    description: desc('Get Support Message', 'GET', 'support/messages/:id', true, null, '200 OK', { id: 'msg_123', subject: 'Help needed' }),
    responses: makeResponses(200, { id: 'msg_123', subject: 'Help needed' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Update Support Message', 'PATCH', 'support/messages/{{contactMessageId}}', {
    auth: true, body: { status: 'RESOLVED', adminNote: 'Issue resolved via phone' },
    description: desc('Update Support Message', 'PATCH', 'support/messages/:id', true, null, '200 OK', { message: 'Updated' }),
    responses: makeResponses(200, { message: 'Updated' }, authErrors)
  }),
  makeRequest('Assign Message to Me', 'POST', 'support/messages/{{contactMessageId}}/assign-me', {
    auth: true,
    description: desc('Assign Message to Me', 'POST', 'support/messages/:id/assign-me', true, null, '200 OK', { message: 'Assigned' }),
    responses: makeResponses(200, { message: 'Assigned' }, authErrors)
  })
]));

// ============ PLANS ============
collection.item.push(makeFolder('Plans', [
  makeRequest('List Plans (Public)', 'GET', 'plans', {
    description: desc('List Plans', 'GET', 'plans', false, null, '200 OK', { plans: [] }),
    responses: makeResponses(200, { plans: [{ id: 'plan_123', name: 'Pro', slug: 'pro' }] })
  }),
  makeRequest('Get Plan by Slug (Public)', 'GET', 'plans/slug/pro', {
    description: desc('Get Plan by Slug', 'GET', 'plans/slug/:slug', false, null, '200 OK', { id: 'plan_123', name: 'Pro' }),
    responses: makeResponses(200, { id: 'plan_123', name: 'Pro' }, notFoundErrors)
  }),
  makeRequest('Get Plan by ID (Public)', 'GET', 'plans/{{planId}}', {
    description: desc('Get Plan by ID', 'GET', 'plans/:id', false, null, '200 OK', { id: 'plan_123', name: 'Pro' }),
    responses: makeResponses(200, { id: 'plan_123', name: 'Pro' }, notFoundErrors)
  }),
  makeRequest('Create Plan (Admin)', 'POST', 'plans', {
    auth: true, body: { name: 'Pro', slug: 'pro', description: 'Professional plan', features: ['Feature 1', 'Feature 2'], limits: { products: 100 }, isActive: true },
    description: desc('Create Plan', 'POST', 'plans', true, null, '201 Created', { id: 'plan_123', name: 'Pro' }),
    events: testSaveId('planId'),
    responses: makeResponses(201, { id: 'plan_123', name: 'Pro' }, authErrors)
  }),
  makeRequest('Update Plan (Admin)', 'PUT', 'plans/{{planId}}', {
    auth: true, body: { name: 'Pro Updated', description: 'Updated pro plan' },
    description: desc('Update Plan', 'PUT', 'plans/:id', true, null, '200 OK', { id: 'plan_123', name: 'Pro Updated' }),
    responses: makeResponses(200, { id: 'plan_123', name: 'Pro Updated' }, authErrors)
  }),
  makeRequest('Update Plan Prices (Admin)', 'PUT', 'plans/{{planId}}/prices', {
    auth: true, body: { prices: [{ currency: 'USD', monthly: 9.99, yearly: 99.99 }] },
    description: desc('Update Plan Prices', 'PUT', 'plans/:id/prices', true, null, '200 OK', { message: 'Prices updated' }),
    responses: makeResponses(200, { message: 'Prices updated' }, authErrors)
  }),
  makeRequest('Toggle Plan Active (Admin)', 'POST', 'plans/{{planId}}/active', {
    auth: true, body: { isActive: false },
    description: desc('Toggle Plan Active', 'POST', 'plans/:id/active', true, null, '200 OK', { message: 'Plan updated' }),
    responses: makeResponses(200, { message: 'Plan updated' }, authErrors)
  })
]));

// ============ SUBSCRIPTIONS ============
collection.item.push(makeFolder('Subscriptions', [
  makeRequest('Create Subscription', 'POST', 'subscriptions', {
    auth: true, body: { planId: '{{planId}}', billingCycle: 'MONTHLY', currency: 'USD', phoneNumber: '+243999000111', correspondent: 'MTN_MOMO_COD' },
    description: desc('Create Subscription', 'POST', 'subscriptions', true, null, '201 Created', { id: 'sub_123', status: 'PENDING' }),
    events: testSaveId('subscriptionId'),
    responses: makeResponses(201, { id: 'sub_123', status: 'PENDING' }, authErrors)
  }),
  makeRequest('Upgrade Subscription', 'POST', 'subscriptions/upgrade', {
    auth: true, body: { planId: '{{planId}}', billingCycle: 'YEARLY', currency: 'USD', phoneNumber: '+243999000111', correspondent: 'MTN_MOMO_COD' },
    description: desc('Upgrade Subscription', 'POST', 'subscriptions/upgrade', true, null, '200 OK', { message: 'Upgrade initiated' }),
    responses: makeResponses(200, { message: 'Upgrade initiated' }, authErrors)
  }),
  makeRequest('Get My Subscription', 'GET', 'subscriptions/me', {
    auth: true,
    description: desc('Get My Subscription', 'GET', 'subscriptions/me', true, null, '200 OK', { id: 'sub_123', planId: 'plan_123' }),
    responses: makeResponses(200, { id: 'sub_123', planId: 'plan_123', status: 'ACTIVE' }, authErrors)
  }),
  makeRequest('Get My Subscription Payments', 'GET', 'subscriptions/me/payments', {
    auth: true,
    description: desc('Get My Subscription Payments', 'GET', 'subscriptions/me/payments', true, null, '200 OK', { payments: [] }),
    responses: makeResponses(200, { payments: [] }, authErrors)
  }),
  makeRequest('Cancel Subscription', 'POST', 'subscriptions/me/cancel', {
    auth: true,
    description: desc('Cancel Subscription', 'POST', 'subscriptions/me/cancel', true, null, '200 OK', { message: 'Subscription cancelled' }),
    responses: makeResponses(200, { message: 'Subscription cancelled' }, authErrors)
  }),
  makeRequest('Reactivate Subscription', 'POST', 'subscriptions/me/reactivate', {
    auth: true,
    description: desc('Reactivate Subscription', 'POST', 'subscriptions/me/reactivate', true, null, '200 OK', { message: 'Subscription reactivated' }),
    responses: makeResponses(200, { message: 'Subscription reactivated' }, authErrors)
  }),
  makeRequest('Check Payment Status', 'POST', 'subscriptions/payments/{{depositId}}/check-status', {
    auth: true,
    description: desc('Check Payment Status', 'POST', 'subscriptions/payments/:depositId/check-status', true, null, '200 OK', { status: 'COMPLETED' }),
    responses: makeResponses(200, { status: 'COMPLETED' }, authErrors)
  }),
  makeRequest('Subscription Stats (Admin)', 'GET', 'subscriptions/stats', {
    auth: true,
    description: desc('Subscription Stats', 'GET', 'subscriptions/stats', true, null, '200 OK', { totalActive: 50, totalCancelled: 10 }),
    responses: makeResponses(200, { totalActive: 50, totalCancelled: 10 }, authErrors)
  }),
  makeRequest('Subscription Revenue (Admin)', 'GET', 'subscriptions/revenue', {
    auth: true,
    description: desc('Subscription Revenue', 'GET', 'subscriptions/revenue', true, null, '200 OK', { monthly: 5000, yearly: 60000 }),
    responses: makeResponses(200, { monthly: 5000, yearly: 60000 }, authErrors)
  })
]));

// ============ ADMIN SUBSCRIPTIONS ============
collection.item.push(makeFolder('Admin Subscriptions', [
  makeRequest('List Subscriptions (Admin)', 'GET', 'subscriptions/admin', {
    auth: true,
    description: desc('List Subscriptions (Admin)', 'GET', 'subscriptions/admin', true, null, '200 OK', { subscriptions: [] }),
    responses: makeResponses(200, { subscriptions: [] }, authErrors)
  }),
  makeRequest('Get Subscription (Admin)', 'GET', 'subscriptions/admin/{{subscriptionId}}', {
    auth: true,
    description: desc('Get Subscription (Admin)', 'GET', 'subscriptions/admin/:id', true, null, '200 OK', { id: 'sub_123' }),
    responses: makeResponses(200, { id: 'sub_123', status: 'ACTIVE' }, [...authErrors, ...notFoundErrors])
  })
]));

// ============ INVOICES ============
collection.item.push(makeFolder('Invoices', [
  makeRequest('Get My Invoices', 'GET', 'invoices/me', {
    auth: true,
    description: desc('Get My Invoices', 'GET', 'invoices/me', true, null, '200 OK', { invoices: [] }),
    responses: makeResponses(200, { invoices: [] }, authErrors)
  }),
  makeRequest('Download Invoice', 'GET', 'invoices/me/download/{{invoiceId}}', {
    auth: true,
    description: desc('Download Invoice', 'GET', 'invoices/me/download/:id', true, null, '200 OK', null),
    responses: makeResponses(200, { url: 'https://cdn.example.com/invoice.pdf' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Invoice Stats', 'GET', 'invoices/stats', {
    auth: true,
    description: desc('Invoice Stats', 'GET', 'invoices/stats', true, null, '200 OK', { total: 10, totalAmount: 500 }),
    responses: makeResponses(200, { total: 10, totalAmount: 500 }, authErrors)
  }),
  makeRequest('List Invoices (Admin)', 'GET', 'invoices/admin', {
    auth: true,
    description: desc('List Invoices (Admin)', 'GET', 'invoices/admin', true, null, '200 OK', { invoices: [] }),
    responses: makeResponses(200, { invoices: [] }, authErrors)
  }),
  makeRequest('Get Invoice (Admin)', 'GET', 'invoices/admin/{{invoiceId}}', {
    auth: true,
    description: desc('Get Invoice (Admin)', 'GET', 'invoices/admin/:id', true, null, '200 OK', { id: 'inv_123' }),
    responses: makeResponses(200, { id: 'inv_123' }, [...authErrors, ...notFoundErrors])
  })
]));

// ============ HERO SLIDES ============
collection.item.push(makeFolder('Hero Slides', [
  makeRequest('Get Hero Slides (Public)', 'GET', 'storefront/hero', {
    description: desc('Get Hero Slides', 'GET', 'storefront/hero', false, null, '200 OK', { slides: [] }),
    responses: makeResponses(200, { slides: [{ id: 'hs_123', title: 'Welcome' }] })
  }),
  makeRequest('List Hero Slides (Admin)', 'GET', 'storefront/admin/hero-slides', {
    auth: true,
    description: desc('List Hero Slides (Admin)', 'GET', 'storefront/admin/hero-slides', true, null, '200 OK', { slides: [] }),
    responses: makeResponses(200, { slides: [] }, authErrors)
  }),
  makeRequest('Create Hero Slide', 'POST', 'storefront/admin/hero-slides', {
    auth: true,
    formdata: [
      { key: 'title', value: 'Summer Sale', type: 'text' },
      { key: 'subtitle', value: 'Up to 50% off', type: 'text' },
      { key: 'linkUrl', value: '/products?sale=true', type: 'text' },
      { key: 'position', value: '1', type: 'text' },
      { key: 'isActive', value: 'true', type: 'text' },
      { key: 'image', type: 'file', src: '/path/to/slide.jpg' }
    ],
    description: desc('Create Hero Slide', 'POST', 'storefront/admin/hero-slides', true, null, '201 Created', { id: 'hs_123', title: 'Summer Sale' }),
    events: testSaveId('heroSlideId'),
    responses: makeResponses(201, { id: 'hs_123', title: 'Summer Sale' }, authErrors)
  }),
  makeRequest('Update Hero Slide', 'PUT', 'storefront/admin/hero-slides/{{heroSlideId}}', {
    auth: true,
    formdata: [
      { key: 'title', value: 'Updated Sale', type: 'text' },
      { key: 'image', type: 'file', src: '/path/to/slide.jpg' }
    ],
    description: desc('Update Hero Slide', 'PUT', 'storefront/admin/hero-slides/:id', true, null, '200 OK', { id: 'hs_123', title: 'Updated Sale' }),
    responses: makeResponses(200, { id: 'hs_123', title: 'Updated Sale' }, authErrors)
  }),
  makeRequest('Delete Hero Slide', 'DELETE', 'storefront/admin/hero-slides/{{heroSlideId}}', {
    auth: true,
    description: desc('Delete Hero Slide', 'DELETE', 'storefront/admin/hero-slides/:id', true, null, '200 OK', { message: 'Slide deleted' }),
    responses: makeResponses(200, { message: 'Slide deleted' }, authErrors)
  })
]));

// ============ ACCOUNTING ============
collection.item.push(makeFolder('Accounting', [
  makeRequest('Get Report', 'GET', 'accounting/report', {
    auth: true,
    description: desc('Get Accounting Report', 'GET', 'accounting/report', true, null, '200 OK', { revenue: 50000, expenses: 20000 }),
    responses: makeResponses(200, { revenue: 50000, expenses: 20000, profit: 30000 }, authErrors)
  }),
  makeRequest('Get Report PDF', 'GET', 'accounting/report/pdf', {
    auth: true,
    description: desc('Get Report PDF', 'GET', 'accounting/report/pdf', true, null, '200 OK', null),
    responses: makeResponses(200, { url: 'https://cdn.example.com/report.pdf' }, authErrors)
  }),
  makeRequest('Get Report CSV', 'GET', 'accounting/report/csv', {
    auth: true,
    description: desc('Get Report CSV', 'GET', 'accounting/report/csv', true, null, '200 OK', null),
    responses: makeResponses(200, { url: 'https://cdn.example.com/report.csv' }, authErrors)
  }),
  makeRequest('Email Report', 'POST', 'accounting/report/email', {
    auth: true,
    description: desc('Email Report', 'POST', 'accounting/report/email', true, null, '200 OK', { message: 'Report emailed' }),
    responses: makeResponses(200, { message: 'Report emailed' }, authErrors)
  }),
  makeRequest('List Reports', 'GET', 'accounting/reports', {
    auth: true,
    description: desc('List Reports', 'GET', 'accounting/reports', true, null, '200 OK', { reports: [] }),
    responses: makeResponses(200, { reports: [] }, authErrors)
  }),
  makeRequest('Get Report PDF by ID', 'GET', 'accounting/reports/{{transactionId}}/pdf', {
    auth: true,
    description: desc('Get Report PDF by ID', 'GET', 'accounting/reports/:id/pdf', true, null, '200 OK', null),
    responses: makeResponses(200, { url: 'https://cdn.example.com/report.pdf' }, [...authErrors, ...notFoundErrors])
  })
]));

// ============ EXPENSES ============
collection.item.push(makeFolder('Expenses', [
  makeRequest('Get Expense Meta', 'GET', 'expenses/meta', {
    auth: true,
    description: desc('Get Expense Meta', 'GET', 'expenses/meta', true, null, '200 OK', { categories: [], paymentMethods: [] }),
    responses: makeResponses(200, { categories: ['OFFICE', 'TRANSPORT'], paymentMethods: ['CASH', 'MOBILE_MONEY'] }, authErrors)
  }),
  makeRequest('List Expenses', 'GET', 'expenses', {
    auth: true,
    description: desc('List Expenses', 'GET', 'expenses', true, null, '200 OK', { expenses: [] }),
    responses: makeResponses(200, { expenses: [] }, authErrors)
  }),
  makeRequest('Get Expense', 'GET', 'expenses/{{expenseId}}', {
    auth: true,
    description: desc('Get Expense', 'GET', 'expenses/:id', true, null, '200 OK', { id: 'exp_123' }),
    responses: makeResponses(200, { id: 'exp_123', amount: 50, category: 'OFFICE' }, [...authErrors, ...notFoundErrors])
  }),
  makeRequest('Create Expense', 'POST', 'expenses', {
    auth: true,
    formdata: [
      { key: 'category', value: 'OFFICE', type: 'text' },
      { key: 'amount', value: '50.00', type: 'text' },
      { key: 'currency', value: 'USD', type: 'text' },
      { key: 'description', value: 'Office supplies', type: 'text' },
      { key: 'date', value: '2026-01-15', type: 'text' },
      { key: 'vendor', value: 'Staples', type: 'text' },
      { key: 'paymentMethod', value: 'CASH', type: 'text' },
      { key: 'receipt', type: 'file', src: '/path/to/receipt.jpg' }
    ],
    description: desc('Create Expense', 'POST', 'expenses', true, null, '201 Created', { id: 'exp_123' }),
    events: testSaveId('expenseId'),
    responses: makeResponses(201, { id: 'exp_123', amount: 50 }, authErrors)
  }),
  makeRequest('Update Expense', 'PUT', 'expenses/{{expenseId}}', {
    auth: true,
    formdata: [
      { key: 'amount', value: '75.00', type: 'text' },
      { key: 'description', value: 'Updated expense', type: 'text' },
      { key: 'receipt', type: 'file', src: '/path/to/receipt.jpg' }
    ],
    description: desc('Update Expense', 'PUT', 'expenses/:id', true, null, '200 OK', { id: 'exp_123', amount: 75 }),
    responses: makeResponses(200, { id: 'exp_123', amount: 75 }, authErrors)
  }),
  makeRequest('Reject Expense', 'POST', 'expenses/{{expenseId}}/reject', {
    auth: true, body: { reason: 'Missing receipt' },
    description: desc('Reject Expense', 'POST', 'expenses/:id/reject', true, null, '200 OK', { message: 'Expense rejected' }),
    responses: makeResponses(200, { message: 'Expense rejected' }, authErrors)
  }),
  makeRequest('Request Expense Approval', 'POST', 'expenses/{{expenseId}}/approve/request', {
    auth: true,
    description: desc('Request Expense Approval', 'POST', 'expenses/:id/approve/request', true, null, '200 OK', { message: 'OTP sent' }),
    responses: makeResponses(200, { message: 'OTP sent' }, authErrors)
  }),
  makeRequest('Resend Expense Approval OTP', 'POST', 'expenses/{{expenseId}}/approve/resend', {
    auth: true,
    description: desc('Resend Expense Approval OTP', 'POST', 'expenses/:id/approve/resend', true, null, '200 OK', { message: 'OTP resent' }),
    responses: makeResponses(200, { message: 'OTP resent' }, authErrors)
  }),
  makeRequest('Confirm Expense Approval', 'POST', 'expenses/{{expenseId}}/approve/confirm', {
    auth: true, body: { otpCode: '123456' },
    description: desc('Confirm Expense Approval', 'POST', 'expenses/:id/approve/confirm', true, null, '200 OK', { message: 'Expense approved' }),
    responses: makeResponses(200, { message: 'Expense approved' }, authErrors)
  }),
  makeRequest('Export Expenses CSV', 'GET', 'expenses/export/csv', {
    auth: true,
    description: desc('Export Expenses CSV', 'GET', 'expenses/export/csv', true, null, '200 OK', null),
    responses: makeResponses(200, { url: 'https://cdn.example.com/expenses.csv' }, authErrors)
  })
]));

// ============ INCIDENTS ============
collection.item.push(makeFolder('Incidents', [
  makeRequest('List Incidents (Public)', 'GET', 'incidents', {
    description: desc('List Incidents', 'GET', 'incidents', false, null, '200 OK', { incidents: [] }),
    responses: makeResponses(200, { incidents: [{ id: 'inc_123', title: 'API Outage', status: 'RESOLVED' }] })
  }),
  makeRequest('Create Incident', 'POST', 'incidents', {
    auth: true, body: { title: 'API Outage', description: 'The API is experiencing downtime', severity: 'HIGH', affectedServices: ['API', 'Payments'] },
    description: desc('Create Incident', 'POST', 'incidents', true, null, '201 Created', { id: 'inc_123', title: 'API Outage' }),
    events: testSaveId('incidentId'),
    responses: makeResponses(201, { id: 'inc_123', title: 'API Outage' }, authErrors)
  }),
  makeRequest('Update Incident', 'PATCH', 'incidents/{{incidentId}}', {
    auth: true, body: { title: 'API Outage - Resolved', description: 'Fixed', severity: 'HIGH', status: 'RESOLVED', affectedServices: ['API'] },
    description: desc('Update Incident', 'PATCH', 'incidents/:id', true, null, '200 OK', { id: 'inc_123', status: 'RESOLVED' }),
    responses: makeResponses(200, { id: 'inc_123', status: 'RESOLVED' }, authErrors)
  }),
  makeRequest('Update Incident Status', 'PATCH', 'incidents/{{incidentId}}/status', {
    auth: true, body: { status: 'RESOLVED' },
    description: desc('Update Incident Status', 'PATCH', 'incidents/:id/status', true, null, '200 OK', { message: 'Status updated' }),
    responses: makeResponses(200, { message: 'Status updated' }, authErrors)
  })
]));

// ============ RIDERS ============
collection.item.push(makeFolder('Riders', [
  makeRequest('List Riders', 'GET', 'riders', {
    auth: true,
    description: desc('List Riders', 'GET', 'riders', true, null, '200 OK', { riders: [] }),
    responses: makeResponses(200, { riders: [] }, authErrors)
  }),
  makeRequest('Create Rider', 'POST', 'riders', {
    auth: true, body: { userId: '{{userId}}' },
    description: desc('Create Rider', 'POST', 'riders', true, null, '201 Created', { id: 'rider_123' }),
    events: testSaveId('riderId'),
    responses: makeResponses(201, { id: 'rider_123' }, authErrors)
  }),
  makeRequest('Suspend Rider', 'POST', 'riders/{{riderId}}/suspend', {
    auth: true,
    description: desc('Suspend Rider', 'POST', 'riders/:id/suspend', true, null, '200 OK', { message: 'Rider suspended' }),
    responses: makeResponses(200, { message: 'Rider suspended' }, authErrors)
  }),
  makeRequest('Reactivate Rider', 'POST', 'riders/{{riderId}}/reactivate', {
    auth: true,
    description: desc('Reactivate Rider', 'POST', 'riders/:id/reactivate', true, null, '200 OK', { message: 'Rider reactivated' }),
    responses: makeResponses(200, { message: 'Rider reactivated' }, authErrors)
  }),
  makeRequest('Delete Rider', 'DELETE', 'riders/{{riderId}}', {
    auth: true,
    description: desc('Delete Rider', 'DELETE', 'riders/:id', true, null, '200 OK', { message: 'Rider deleted' }),
    responses: makeResponses(200, { message: 'Rider deleted' }, authErrors)
  }),
  makeRequest('Get My Deliveries (Rider)', 'GET', 'riders/me/deliveries', {
    auth: true,
    description: desc('Get My Deliveries', 'GET', 'riders/me/deliveries', true, null, '200 OK', { deliveries: [] }),
    responses: makeResponses(200, { deliveries: [] }, authErrors)
  })
]));

// Write the collection
const outputPath = path.join(__dirname, 'SwiftGoma.postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
console.log(`Collection written to ${outputPath}`);
console.log(`Total folders: ${collection.item.length}`);
const totalRequests = collection.item.reduce((sum, folder) => sum + (folder.item ? folder.item.length : 0), 0);
console.log(`Total requests: ${totalRequests}`);
