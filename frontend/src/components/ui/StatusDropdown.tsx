import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { StatusBadge } from './Badge';
import { useUpdateLead } from '../../hooks/useLeads';
import type { LeadStatus } from '../../types';

const STATUS_OPTIONS: LeadStatus[] = [
  'novo',
  'em_atendimento',
  'qualificado',
  'ganho',
  'perdido',
];

interface StatusDropdownProps {
  leadId: number;
  currentStatus: LeadStatus | null;
}

export function StatusDropdown({ leadId, currentStatus }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const updateLead = useUpdateLead();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(status: LeadStatus) {
    if (status === currentStatus) {
      setOpen(false);
      return;
    }
    updateLead.mutate({ id: leadId, data: { status } });
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
        disabled={updateLead.isPending}
      >
        <StatusBadge status={currentStatus} />
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${s === currentStatus ? 'bg-gray-700' : ''}`}
            >
              <StatusBadge status={s} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
