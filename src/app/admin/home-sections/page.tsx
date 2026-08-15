'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  Modal,
  Segmented,
  Space,
  Switch,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd';
import {
  CopyOutlined,
  EditOutlined,
  EyeOutlined,
  HolderOutlined,
  LockOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import HomeSectionCopyModal from '@/components/HomeSectionCopyModal';
import HomeSectionEditorDrawer from '@/components/HomeSectionEditorDrawer';
import HomeSectionPhonePreview from '@/components/HomeSectionPhonePreview';
import {
  buildHomeSectionConfigs,
  cloneSections,
  platformLabels,
  platforms,
  sectionTypeLabels,
  type HomeSection,
  type HomeSectionConfigs,
  type Platform,
} from '@/data/homeSectionsData';

const { Title, Text } = Typography;

type ConfigStatus = 'draft' | 'published';

const initialStatus = (): Record<Platform, ConfigStatus> => ({
  filbet: 'published',
  filgame: 'published',
  filslot: 'published',
  filplay: 'published',
});

const initialTimestamps = (): Record<Platform, string> => ({
  filbet: '',
  filgame: '',
  filslot: '',
  filplay: '',
});

export default function HomeSectionsPage() {
  const { token } = theme.useToken();
  const [platform, setPlatform] = useState<Platform>('filbet');
  const [configs, setConfigs] = useState<HomeSectionConfigs>(() => buildHomeSectionConfigs());
  const [configStatus, setConfigStatus] = useState(initialStatus);
  const [lastUpdated, setLastUpdated] = useState(initialTimestamps);
  const [copyOpen, setCopyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'draft' | 'published'>('draft');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [creating, setCreating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const draftSections = configs[platform].draft;
  const publishedSections = configs[platform].published;

  const markDraftEdited = (targetPlatform = platform) => {
    setConfigStatus((current) => ({ ...current, [targetPlatform]: 'draft' }));
    setLastUpdated((current) => ({
      ...current,
      [targetPlatform]: dayjs().format('MM-DD HH:mm'),
    }));
  };

  const updateDraft = (sections: HomeSection[]) => {
    setConfigs((current) => ({
      ...current,
      [platform]: {
        ...current[platform],
        draft: cloneSections(sections),
      },
    }));
    markDraftEdited();
  };

  const changeEnabled = (sectionId: string, enabled: boolean) => {
    updateDraft(draftSections.map((section) => (
      section.id === sectionId ? { ...section, enabled } : section
    )));
  };

  const dropSection = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const nextSections = cloneSections(draftSections);
    const [moved] = nextSections.splice(draggedIndex, 1);
    nextSections.splice(targetIndex, 0, moved);
    setDraggedIndex(null);
    updateDraft(nextSections);
  };

  const openEditor = (section: HomeSection) => {
    setCreating(false);
    setEditingSection({ ...section, gameIds: [...section.gameIds] });
    setEditorOpen(true);
  };

  const openCreateEditor = () => {
    setCreating(true);
    setEditingSection({
      id: `${platform}-custom-${Date.now()}`,
      name: '',
      type: 'custom',
      enabled: true,
      locked: false,
      layout: 'landscape',
      displayCount: 8,
      gameIds: [],
    });
    setEditorOpen(true);
  };

  const saveEditor = (section: HomeSection) => {
    if (creating) {
      updateDraft([...draftSections, section]);
      message.success('已新增自定義板塊至草稿');
    } else {
      updateDraft(draftSections.map((item) => item.id === section.id ? section : item));
      message.success('板塊草稿已更新');
    }
    setEditorOpen(false);
    setEditingSection(null);
    setCreating(false);
  };

  const saveDraft = () => {
    markDraftEdited();
    message.success(`${platformLabels[platform]} 草稿已儲存`);
  };

  const publish = () => {
    setConfigs((current) => ({
      ...current,
      [platform]: {
        ...current[platform],
        published: cloneSections(current[platform].draft),
      },
    }));
    setConfigStatus((current) => ({ ...current, [platform]: 'published' }));
    setLastUpdated((current) => ({ ...current, [platform]: dayjs().format('MM-DD HH:mm') }));
    message.success(`${platformLabels[platform]} 首頁板塊已發布`);
  };

  const applyCopies = (copies: Partial<Record<Platform, HomeSection[]>>) => {
    setConfigs((current) => {
      const next = { ...current };
      (Object.entries(copies) as [Platform, HomeSection[]][]).forEach(([target, sections]) => {
        next[target] = { ...next[target], draft: cloneSections(sections) };
      });
      return next;
    });
    const copiedPlatforms = Object.keys(copies) as Platform[];
    const now = dayjs().format('MM-DD HH:mm');
    setConfigStatus((current) => copiedPlatforms.reduce(
      (next, target) => ({ ...next, [target]: 'draft' }),
      current,
    ));
    setLastUpdated((current) => copiedPlatforms.reduce(
      (next, target) => ({ ...next, [target]: now }),
      current,
    ));
    setCopyOpen(false);
  };

  const statusText = configStatus[platform] === 'published'
    ? `已發布${lastUpdated[platform] ? `・${lastUpdated[platform]}` : ''}`
    : `草稿・最後編輯 ${lastUpdated[platform] || '剛剛'}`;

  return (
    <div data-e2e-id="home-sections-page">
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>首頁板塊配置</Title>
      </div>

      <Segmented<Platform>
        value={platform}
        options={platforms.map((item) => ({ label: platformLabels[item], value: item }))}
        onChange={setPlatform}
        style={{ marginBottom: 16 }}
        data-e2e-id="home-sections-platform-segmented"
      />

      <Card size="small" data-e2e-id="home-sections-config-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: `1px solid ${token.colorSplit}`,
          }}
        >
          <Text type="secondary" data-e2e-id="home-sections-status-text">{statusText}</Text>
          <Space wrap>
            <Button
              icon={<CopyOutlined />}
              onClick={() => setCopyOpen(true)}
              data-e2e-id="home-sections-copy-btn"
            >
              複製到其他平台
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                setPreviewMode('draft');
                setPreviewOpen(true);
              }}
              data-e2e-id="home-sections-preview-btn"
            >
              預覽
            </Button>
            <Button
              icon={<SaveOutlined />}
              onClick={saveDraft}
              data-e2e-id="home-sections-save-draft-btn"
            >
              儲存草稿
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={publish}
              data-e2e-id="home-sections-publish-btn"
            >
              發布
            </Button>
          </Space>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(560px, 1fr) 410px', gap: 24, alignItems: 'start' }}>
          <div data-e2e-id="home-sections-list">
            <Text strong style={{ display: 'block', marginBottom: 10 }}>板塊排序</Text>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {draftSections.map((section, index) => (
                <div
                  key={section.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropSection(index)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '34px minmax(0, 1fr) auto auto',
                    gap: 12,
                    alignItems: 'center',
                    minHeight: 68,
                    padding: '10px 12px',
                    borderRadius: token.borderRadiusLG,
                    border: `1px solid ${token.colorBorder}`,
                    background: token.colorBgContainer,
                    opacity: section.enabled ? 1 : 0.68,
                  }}
                  data-e2e-id={`home-section-row-${section.id}`}
                >
                  <span
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggedIndex(index);
                    }}
                    onDragEnd={() => setDraggedIndex(null)}
                    style={{ cursor: 'grab', color: token.colorTextSecondary, fontSize: 18 }}
                    data-e2e-id={`home-section-drag-handle-${section.id}`}
                  >
                    <HolderOutlined />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <Space size={6}>
                      <Text strong ellipsis>{section.name}</Text>
                      {section.locked && (
                        <Tooltip title={section.type === 'system' ? '系統板塊已鎖定' : '基礎分類名稱已鎖定'}>
                          <LockOutlined style={{ color: token.colorTextSecondary }} />
                        </Tooltip>
                      )}
                    </Space>
                    <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                      {sectionTypeLabels[section.type]}
                      {section.type !== 'system'
                        ? ` ｜ ${section.layout === 'landscape' ? '橫版' : '直版'} ｜ 展示 ${section.displayCount} ｜ 候選 ${section.gameIds.length}`
                        : ' ｜ 排行榜演算法產生'}
                    </Text>
                  </div>
                  <Switch
                    checked={section.enabled}
                    checkedChildren="啟用"
                    unCheckedChildren="停用"
                    onChange={(enabled) => changeEnabled(section.id, enabled)}
                    data-e2e-id={`home-section-enabled-switch-${section.id}`}
                  />
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => openEditor(section)}
                    data-e2e-id={`home-section-edit-btn-${section.id}`}
                  >
                    編輯
                  </Button>
                </div>
              ))}
            </Space>
            <Button
              block
              type="dashed"
              icon={<PlusOutlined />}
              onClick={openCreateEditor}
              style={{ marginTop: 12 }}
              data-e2e-id="home-section-create-custom-btn"
            >
              新增自定義板塊
            </Button>
          </div>

          <div style={{ position: 'sticky', top: 72 }}>
            <Text strong style={{ display: 'block', marginBottom: 10 }}>草稿即時預覽</Text>
            <HomeSectionPhonePreview platform={platform} sections={draftSections} />
          </div>
        </div>
      </Card>

      <HomeSectionEditorDrawer
        open={editorOpen}
        platform={platform}
        section={editingSection}
        onCancel={() => {
          setEditorOpen(false);
          setEditingSection(null);
          setCreating(false);
        }}
        onConfirm={saveEditor}
      />

      <HomeSectionCopyModal
        open={copyOpen}
        sourcePlatform={platform}
        sourceSections={draftSections}
        onCancel={() => setCopyOpen(false)}
        onCopy={applyCopies}
      />

      <Modal
        title={`${platformLabels[platform]} 首頁預覽`}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={760}
        footer={(
          <Button onClick={() => setPreviewOpen(false)} data-e2e-id="home-sections-preview-close-btn">
            關閉
          </Button>
        )}
        data-e2e-id="home-sections-preview-modal"
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Segmented
            value={previewMode}
            options={[
              { label: '草稿', value: 'draft' },
              { label: '已發布', value: 'published' },
            ]}
            onChange={(value) => setPreviewMode(value as 'draft' | 'published')}
            data-e2e-id="home-sections-preview-mode-segmented"
          />
        </div>
        <HomeSectionPhonePreview
          platform={platform}
          sections={previewMode === 'draft' ? draftSections : publishedSections}
          title={previewMode === 'draft' ? '草稿預覽' : '已發布預覽'}
        />
      </Modal>
    </div>
  );
}
