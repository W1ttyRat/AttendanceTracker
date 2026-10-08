"use client";

export default function AttendeeRow({ attendee, onToggle }) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={attendee.present}
          onChange={() => onToggle(attendee.id)}
        />
        {attendee.name}
      </label>
    </li>
  );
}