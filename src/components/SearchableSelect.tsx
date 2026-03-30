'use client';

import dynamic from 'next/dynamic';
import type { Props as ReactSelectProps, GroupBase } from 'react-select';

// Dynamic import to avoid SSR hydration issues
const Select = dynamic(() => import('react-select'), { ssr: false }) as React.ComponentType<
  ReactSelectProps<SelectOption, false, GroupBase<SelectOption>>
>;

export interface SelectOption {
  value: string | number;
  label: string;
  data?: unknown;
}

export interface SelectGroupOption {
  label: string;
  options: SelectOption[];
}

export type SelectOptions = (SelectOption | SelectGroupOption)[];

interface SearchableSelectProps {
  options: SelectOptions;
  value: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
  placeholder?: string;
  isLoading?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  onInputChange?: (value: string) => void;
  noOptionsMessage?: string;
  loadingMessage?: string;
  className?: string;
  menuPortalTarget?: HTMLElement | null;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  isLoading = false,
  isClearable = true,
  isDisabled = false,
  onInputChange,
  noOptionsMessage = 'Tidak ada data',
  loadingMessage = 'Memuat...',
  className = '',
  menuPortalTarget,
}: SearchableSelectProps) {
  return (
    <Select
      classNamePrefix="select"
      className={`bubblegum-select ${className}`}
      options={options as unknown as readonly (SelectOption | GroupBase<SelectOption>)[]}
      value={value}
      onChange={(opt) => onChange(opt as SelectOption | null)}
      placeholder={placeholder}
      isLoading={isLoading}
      isClearable={isClearable}
      isDisabled={isDisabled}
      isSearchable
      onInputChange={onInputChange}
      noOptionsMessage={() => noOptionsMessage}
      loadingMessage={() => loadingMessage}
      menuPortalTarget={menuPortalTarget}
      menuPlacement="auto"
      formatGroupLabel={(group) => (
        <div className="flex items-center gap-2 py-1">
          <span className="text-xs font-bold text-grape-600 uppercase tracking-wide">
            {group.label}
          </span>
          <span className="text-[10px] text-bubblegum-400 bg-bubblegum-100 px-1.5 py-0.5 rounded-full font-medium">
            {group.options.length}
          </span>
        </div>
      )}
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: '44px',
          borderRadius: '16px',
          borderWidth: '2px',
          borderColor: state.isFocused ? '#4f46e5' : '#bfdbfe',
          backgroundColor: 'rgba(255,255,255,0.5)',
          boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : 'none',
          '&:hover': {
            borderColor: '#60a5fa',
          },
          fontSize: '0.875rem',
          cursor: 'pointer',
        }),
        menu: (base) => ({
          ...base,
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #dbeafe',
          boxShadow: '0 10px 40px rgba(30, 58, 138, 0.12)',
          zIndex: 50,
        }),
        menuList: (base) => ({
          ...base,
          padding: '4px',
        }),
        group: (base) => ({
          ...base,
          paddingTop: '4px',
          paddingBottom: '4px',
        }),
        groupHeading: (base) => ({
          ...base,
          margin: 0,
          padding: '6px 12px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#4338ca',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          backgroundColor: '#eef2ff',
          borderRadius: '8px',
          marginBottom: '2px',
        }),
        option: (base, state) => ({
          ...base,
          borderRadius: '12px',
          padding: '10px 14px',
          cursor: 'pointer',
          backgroundColor: state.isSelected
            ? '#1e40af'
            : state.isFocused
            ? '#eff6ff'
            : 'transparent',
          color: state.isSelected ? 'white' : '#1e3a8a',
          fontSize: '0.875rem',
          '&:active': {
            backgroundColor: '#dbeafe',
          },
        }),
        singleValue: (base) => ({
          ...base,
          color: '#1e3a8a',
          fontSize: '0.875rem',
        }),
        placeholder: (base) => ({
          ...base,
          color: '#93c5fd',
          fontSize: '0.875rem',
        }),
        input: (base) => ({
          ...base,
          color: '#1e3a8a',
          fontSize: '0.875rem',
        }),
        indicatorSeparator: (base) => ({
          ...base,
          backgroundColor: '#bfdbfe',
        }),
        dropdownIndicator: (base, state) => ({
          ...base,
          color: state.isFocused ? '#4f46e5' : '#93c5fd',
          '&:hover': {
            color: '#2563eb',
          },
        }),
        clearIndicator: (base) => ({
          ...base,
          color: '#93c5fd',
          '&:hover': {
            color: '#2563eb',
          },
        }),
        loadingIndicator: (base) => ({
          ...base,
          color: '#3b82f6',
        }),
        noOptionsMessage: (base) => ({
          ...base,
          color: '#93c5fd',
          fontSize: '0.875rem',
        }),
        menuPortal: (base) => ({
          ...base,
          zIndex: 9999,
        }),
      }}
    />
  );
}
