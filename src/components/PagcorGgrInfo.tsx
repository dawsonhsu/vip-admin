import React from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const GGR_TOOLTIP = 'GGR =（有效投注 − JP 貢獻）−（有效派彩 − JP 派彩）';

export default function PagcorGgrInfo({ dataE2eId, color = '#8c8c8c' }: { dataE2eId: string; color?: string }) {
  return (
    <Tooltip title={GGR_TOOLTIP}>
      <InfoCircleOutlined
        data-e2e-id={dataE2eId}
        style={{ marginLeft: 5, color, cursor: 'help' }}
      />
    </Tooltip>
  );
}
