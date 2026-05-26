'use client';

import React, { useMemo } from 'react';
import { Select } from 'antd';
import { memberStatMembers } from '@/data/memberStatsData';

interface MemberSelectProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  dataE2eId?: string;
  style?: React.CSSProperties;
}

interface MemberOption {
  value: string;
  label: string;
  searchText: string;
}

export default function MemberSelect({
  value,
  onChange,
  placeholder = '輸入會員帳號 / UID / 手機號',
  dataE2eId,
  style,
}: MemberSelectProps) {
  const options = useMemo<MemberOption[]>(
    () =>
      memberStatMembers.map(m => ({
        value: m.uid,
        label: `${m.username} (UID: ${m.uid} / ${m.phone})`,
        searchText: `${m.username} ${m.uid} ${m.phone}`.toLowerCase(),
      })),
    [],
  );

  return (
    <Select
      data-e2e-id={dataE2eId}
      showSearch
      allowClear
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      filterOption={(input, option) =>
        (option as MemberOption | undefined)?.searchText?.includes(input.toLowerCase()) ?? false
      }
      style={style}
    />
  );
}
