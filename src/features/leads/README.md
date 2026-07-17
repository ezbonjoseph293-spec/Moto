# leads

Public lead capture (`schema.ts`, `service.ts`, `actions.ts`) landed with the
storefront in Stage 5: the contact form and vehicle-inquiry form both call
`forDealership()`-scoped `createContactLead()` / `createVehicleInquiryLead()`
via rate-limited Server Actions — no session required.

The unified admin inbox (statuses, staff assignment, notes, new-lead
notifications) is Stage 7.
