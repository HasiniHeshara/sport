# Participant Tournament Registration - Clickable Task List

## Quick Click Links
- Swagger UI: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- Postman Collection File: [Sportix-API-Collection.postman_collection.json](./Sportix-API-Collection.postman_collection.json)

## Goal
Enable a registered participant to:
1. View all available tournaments.
2. Open each tournament and click a team registration button.
3. Register a team with member details before tournament start.
4. Submit the registration to tournament manager dashboard for approval.
5. Receive status updates (Pending, Approved, Rejected).

## Main Task 1: Participant Tournament Listing
- [x] Show all published tournaments in participant dashboard.
- [x] Add card/table with tournament name, sport, start date, deadline, and status.
- [x] Add `Register Team` button for each tournament.
- [x] Disable `Register Team` when deadline passed or already registered.

### Clickable APIs
- [GET /api/tournaments/published](http://localhost:5000/api/tournaments/published)
- [GET /api/tournaments/TOURNAMENT_ID](http://localhost:5000/api/tournaments/TOURNAMENT_ID)

## Main Task 2: Participant Team Registration Form
- [x] Build registration page/modal opened from `Register Team`.
- [x] Add fields: team name, leader contact, dynamic members.
- [x] Add member fields: name, IT number, contact number.
- [x] Validate required fields, team size, deadline, and unique IT numbers.
- [x] Submit and show success/error messages.

### Clickable APIs
- [POST /api/tournaments/TOURNAMENT_ID/register-team](http://localhost:5000/api/tournaments/TOURNAMENT_ID/register-team)

### Example Request Body
```json
{
  "teamName": "Team Alpha",
  "contactNumber": "0712345678",
  "members": [
    { "name": "Member 1", "itNumber": "IT1001", "contactNumber": "0710000001" },
    { "name": "Member 2", "itNumber": "IT1002", "contactNumber": "0710000002" }
  ]
}
```

## Main Task 3: Participant Registration Status Tracking
- [x] Add dashboard section: `My Tournament Registrations`.
- [x] Show registration status: Pending, Approved, Rejected.
- [x] Show rejection reason when rejected.
- [x] Optionally allow edit/re-submit if rejected and still open.

### Clickable APIs
- [GET /api/tournaments/TOURNAMENT_ID/my-registration](http://localhost:5000/api/tournaments/TOURNAMENT_ID/my-registration)
- [GET /api/registrations/my](http://localhost:5000/api/registrations/my)
- [PUT /api/registrations/REGISTRATION_ID](http://localhost:5000/api/registrations/REGISTRATION_ID)

## Main Task 4: Send Registration to Tournament Manager for Approval
- [x] Auto-add submitted team to manager approval queue.
- [x] Show manager dashboard list with pending registrations.
- [x] Show team, leader, and tournament details.
- [x] Add actions: Approve and Reject with reason.
- [ ] Notify participant on decision.

### Clickable APIs
- [GET /api/tournaments/TOURNAMENT_ID/registrations](http://localhost:5000/api/tournaments/TOURNAMENT_ID/registrations)
- [PATCH /api/registrations/REGISTRATION_ID/approve](http://localhost:5000/api/registrations/REGISTRATION_ID/approve)
- [PATCH /api/registrations/REGISTRATION_ID/reject](http://localhost:5000/api/registrations/REGISTRATION_ID/reject)

### Reject Body
```json
{
  "reason": "Team size does not meet minimum requirement"
}
```

## Main Task 5: Security, Roles, and Rules
- [x] Enforce role-based access for participant and manager endpoints.
- [x] Read user identity from JWT token (not from frontend leaderId).
- [x] Prevent duplicate registration per participant per tournament.
- [x] Prevent duplicate team names within same tournament.
- [x] Prevent registration after deadline or when team limit reached.

### Clickable API
- [POST /api/users/login](http://localhost:5000/api/users/login)

## Main Task 6: Participant Dashboard UX
- [x] Add dashboard sections: available tournaments and my registrations.
- [x] Add button states: `Register Team`, `Already Registered`, `Registration Closed`.
- [x] Add loading, empty, and error states.
- [x] Add alerts/toasts for API responses.

### Reused Clickable APIs
- [GET /api/tournaments/published](http://localhost:5000/api/tournaments/published)
- [GET /api/registrations/my](http://localhost:5000/api/registrations/my)
- [POST /api/tournaments/TOURNAMENT_ID/register-team](http://localhost:5000/api/tournaments/TOURNAMENT_ID/register-team)

## Main Task 7: Notifications
- [x] In-app notification when participant submits team.
- [x] In-app notification on approve/reject.
- [ ] Optional email notification on submit/decision.

### Clickable APIs
- [POST /api/notifications](http://localhost:5000/api/notifications)
- [POST /api/notifications/email](http://localhost:5000/api/notifications/email)

## Main Task 8: QA and Acceptance
- [x] Test success path for team registration before deadline.
- [ ] Test failure when deadline passed.
- [ ] Test duplicate registration prevention.
- [ ] Test team-size limit validation.
- [ ] Test manager approve and reject flows.
- [x] Test status visibility in participant dashboard.

## Delivery Order
- [x] 1. Finalize JWT auth and role middleware.
- [x] 2. Finish participant tournament listing and button states.
- [x] 3. Finish team registration form and submit flow.
- [x] 4. Implement manager approval APIs and manager queue UI.
- [x] 5. Implement participant registration status list.
- [x] 6. Add notifications.
- [ ] 7. Complete tests and final acceptance.

## Definition of Done
- [x] Participant can view all published tournaments.
- [x] Participant can register one team per tournament before deadline.
- [x] Registration status appears as Pending in participant dashboard.
- [x] Registration appears in manager dashboard approval queue.
- [x] Manager can approve/reject with reason.
- [x] Participant can see final status updates.
- [x] JWT and role authorization enforced on protected APIs.

## Implementation Update (This Iteration)
- [x] Backend: Added `teamRegistrationModel` with status and rejection reason.
- [x] Backend: Added JWT auth middleware + role guard middleware.
- [x] Backend: Added participant APIs for register team, my registration, and my registrations list.
- [x] Backend: Added organizer APIs for registration list, approve, and reject.
- [x] Frontend: Added participant dashboard with tournament list + register button states.
- [x] Frontend: Added tournament details page with team registration form and rejected re-submit flow.
- [x] Frontend: Added organizer page to view registrations and approve/reject.
- [x] Frontend: Updated routes for participant dashboard, tournament details, and organizer registration management.
- [x] Frontend: Added participant in-app notifications panel with local persistence.
- [x] Frontend: Added "My Tournament Registrations" section with direct resubmit/view actions.
