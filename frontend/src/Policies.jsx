import React from 'react';
import { Helmet } from 'react-helmet';

export default function Policies() {
  return (
    <div className="max-w-4xl mx-auto">
      <Helmet>
        <title>Policies</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Policies
        </h1>
        <p className="mt-2 text-gray-500">
          Workspace booking rules (shown for clarity; enforcement is handled by the backend).
        </p>
      </div>

      <div className="grid gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">
            Booking Hours
          </h2>
          <p className="text-gray-600">
            Bookings are allowed only between <span className="font-semibold">9:00 AM</span> and{' '}
            <span className="font-semibold">5:00 PM</span>.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">
            Board Room Approval
          </h2>
          <p className="text-gray-600">
            Board Room bookings require <span className="font-semibold">admin approval</span>. Standard rooms may be confirmed instantly depending on availability.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">
            Check-In Window
          </h2>
          <p className="text-gray-600">
            Check-in becomes available <span className="font-semibold">at your booking start time</span>.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">
            Auto Check-Out / No-Show
          </h2>
          <p className="text-gray-600">
            If you do not check in within <span className="font-semibold">15 minutes after</span> your booking start time, the system may automatically update the booking status (auto check-out / no-show).
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">
            Cancellation & Refunds
          </h2>
          <p className="text-gray-600">
            If you cancel a booking at least <span className="font-semibold">48 hours</span> before the start time, you receive a <span className="font-semibold">90%</span> refund (10% deduction). If you cancel within <span className="font-semibold">48 hours</span> of the start time, no refund is provided.
          </p>
        </div>
      </div>
    </div>
  );
}
