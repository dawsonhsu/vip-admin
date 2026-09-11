'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ColorPicker, Divider, Input, Popover, Select, Space, Tooltip, theme } from 'antd';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  ClearOutlined,
  CodeOutlined,
  FontColorsOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';

/** 段落樣式：正文 + 三級標題 */
const BLOCK_OPTIONS = [
  { value: 'p', label: '正文' },
  { value: 'h1', label: '大標題 H1' },
  { value: 'h2', label: '中標題 H2' },
  { value: 'h3', label: '小標題 H3' },
];

const COLOR_PRESETS = [
  {
    label: '常用色',
    colors: ['#000000', '#595959', '#8c8c8c', '#f5222d', '#fa8c16', '#faad14', '#52c41a', '#1677ff', '#722ed1'],
  },
];

/** 允許保留的標籤；其餘標籤只脫掉外殼、保留文字 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);
/** 連內容一起丟掉的標籤 */
const DROPPED_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input',
  'button', 'select', 'textarea', 'svg', 'math', 'base', 'noscript',
]);
const GLOBAL_ATTRS = new Set(['style']);
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
};
const ALLOWED_STYLE_PROPS = new Set([
  'color', 'background-color', 'font-weight', 'font-style', 'font-size',
  'text-decoration', 'text-decoration-line', 'text-align',
]);
const SAFE_LINK = /^(https?:|mailto:|tel:|\/|#)/i;
const SAFE_IMAGE = /^(https?:|\/|data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,)/i;

/** 允許的 URL 協定（擋掉 javascript: / data:text-html 之類） */
export function isSafeLinkUrl(url: string): boolean {
  return SAFE_LINK.test(url.trim());
}

/**
 * 白名單清洗 HTML。只在「外部字串要寫進 DOM」時呼叫（初始值、HTML 原始碼模式），
 * 使用者一般打字的路徑不經過這裡，避免每次按鍵重排 DOM 導致游標亂跳。
 */
export function sanitizeRichText(html: string): string {
  if (!html) return '';
  // DOMParser 產生惰性文件：不載入資源、不執行 script
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return '';
  const doc = new window.DOMParser().parseFromString(html, 'text/html');

  const clean = (parent: Element) => {
    Array.from(parent.children).forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (DROPPED_TAGS.has(tag)) {
        el.remove();
        return;
      }
      if (!ALLOWED_TAGS.has(tag)) {
        clean(el);
        while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
        el.remove();
        return;
      }
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (!(GLOBAL_ATTRS.has(name) || TAG_ATTRS[tag]?.has(name))) {
          el.removeAttribute(attr.name);
          return;
        }
        if (name === 'href' && !isSafeLinkUrl(attr.value)) {
          el.removeAttribute(attr.name);
          return;
        }
        if (name === 'src' && !SAFE_IMAGE.test(attr.value.trim())) {
          el.remove();
          return;
        }
        if (name === 'style') {
          const safe = attr.value
            .split(';')
            .map((decl) => decl.trim())
            .filter((decl) => {
              if (!decl || /url\(|expression|javascript:/i.test(decl)) return false;
              return ALLOWED_STYLE_PROPS.has(decl.split(':')[0].trim().toLowerCase());
            })
            .join('; ');
          if (safe) el.setAttribute('style', safe);
          else el.removeAttribute('style');
        }
      });
      if (el.isConnected) clean(el);
    });
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

/** 把富文本 HTML 轉純文字（給字數統計與必填驗證用） */
export function richTextToPlainText(html?: string): string {
  if (!html) return '';
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n');
  // DOMParser 產生的是惰性文件（不載入資源、不執行 script），用來正確還原 HTML 實體
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    const doc = new window.DOMParser().parseFromString(withBreaks, 'text/html');
    return (doc.body.textContent || '').replace(/\u00a0/g, ' ').trim();
  }
  return withBreaks
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

/** 只有空標籤／空白時視為未填寫 */
export function isRichTextEmpty(html?: string): boolean {
  if (!html) return true;
  if (/<img|<video|<iframe/i.test(html)) return false;
  return richTextToPlainText(html).length === 0;
}

const CONTENT_CSS = `
.vip-rte-content { outline: none; word-break: break-word; }
.vip-rte-content h1 { font-size: 24px; line-height: 1.4; font-weight: 600; margin: 12px 0 8px; }
.vip-rte-content h2 { font-size: 20px; line-height: 1.4; font-weight: 600; margin: 12px 0 8px; }
.vip-rte-content h3 { font-size: 16px; line-height: 1.5; font-weight: 600; margin: 10px 0 6px; }
.vip-rte-content p { margin: 0 0 8px; }
.vip-rte-content ul, .vip-rte-content ol { margin: 0 0 8px; padding-left: 24px; }
.vip-rte-content li { margin-bottom: 4px; }
.vip-rte-content a { color: #1677ff; text-decoration: underline; }
.vip-rte-content :last-child { margin-bottom: 0; }
`;

interface RichTextEditorProps {
  /** HTML 字串（受控值，交給 antd Form.Item 注入） */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** 編輯區最小高度 */
  minHeight?: number;
  /** 純文字字數上限；超過只提示不阻擋輸入 */
  maxLength?: number;
  disabled?: boolean;
  'data-e2e-id'?: string;
  /** 以下由 antd Form.Item 自動注入 */
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  'aria-required'?: boolean | 'true' | 'false';
}

/**
 * 輕量富文本編輯器（contentEditable + execCommand，零外部依賴）。
 * 對外行為與一般 antd 表單控件一致：吃 value、吐 onChange(HTML)。
 */
export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = '請輸入內容',
  minHeight = 200,
  maxLength,
  disabled = false,
  'data-e2e-id': dataE2eId,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
}: RichTextEditorProps) {
  const { token } = theme.useToken();
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const composingRef = useRef(false);
  const [sourceMode, setSourceMode] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkError, setLinkError] = useState('');
  const [focused, setFocused] = useState(false);
  const [marks, setMarks] = useState<Record<string, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });
  const [block, setBlock] = useState('p');

  // 每次 render 都比對，DOM 與受控值不一致時才回寫（外部值被父層改寫／拒絕時也能收斂）。
  // 只有內容真的不同才動 DOM，正常打字不會經過這裡，游標不會被重設。
  useEffect(() => {
    const el = editorRef.current;
    if (!el || sourceMode || composingRef.current) return;
    if (el.innerHTML === value) return;
    const safe = sanitizeRichText(value || '');
    if (el.innerHTML !== safe) el.innerHTML = safe;
    // 清洗結果與傳入值不同時回寫表單，否則每次 render 都會重跑清洗
    if (safe !== (value || '')) onChange?.(safe);
  });

  const saveSelection = useCallback(() => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    const live = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    // 選區還在編輯區內（例如工具列按鈕已 preventDefault 保住焦點）就直接沿用，
    // 只有焦點被 Select / ColorPicker / Popover 搶走時才回復先前存下的選區。
    if (live && el.contains(live.commonAncestorContainer)) {
      el.focus();
      return;
    }
    el.focus();
    const range = savedRange.current;
    if (!range || !sel || !el.contains(range.commonAncestorContainer)) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  // 編輯區有焦點時持續記錄選區，避免點開浮層（顏色 / 段落樣式）後選區遺失
  useEffect(() => {
    if (!focused) return;
    const handler = () => {
      const el = editorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (el.contains(range.commonAncestorContainer)) {
        savedRange.current = range.cloneRange();
      }
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [focused]);

  const syncToolbarState = useCallback(() => {
    if (typeof document === 'undefined') return;
    try {
      setMarks({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
      });
      const current = (document.queryCommandValue('formatBlock') || 'p').toString().toLowerCase();
      setBlock(BLOCK_OPTIONS.some((o) => o.value === current) ? current : 'p');
    } catch {
      // queryCommand* 在部分瀏覽器選區為空時會拋錯，忽略即可
    }
  }, []);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML === '<br>' ? '' : el.innerHTML;
    onChange?.(html);
  }, [onChange]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      if (disabled) return;
      restoreSelection();
      try {
        document.execCommand('styleWithCSS', false, 'true');
      } catch {
        // Safari 舊版不支援，忽略
      }
      document.execCommand(command, false, arg);
      emitChange();
      saveSelection();
      syncToolbarState();
    },
    [disabled, restoreSelection, emitChange, saveSelection, syncToolbarState]
  );

  // 貼上一律轉純文字，避免帶入 Word / 網頁的髒樣式
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emitChange();
  };

  const handleInsertLink = () => {
    const url = linkUrl.trim();
    if (!url || url === 'https://') {
      setLinkOpen(false);
      return;
    }
    if (!isSafeLinkUrl(url)) {
      setLinkError('僅支援 http(s):// 、mailto: 、tel: 或站內路徑');
      return;
    }
    setLinkError('');
    setLinkOpen(false);
    exec('createLink', url);
    setLinkUrl('https://');
  };

  const plainLength = richTextToPlainText(value).length;
  const overLimit = typeof maxLength === 'number' && plainLength > maxLength;
  const showPlaceholder = plainLength === 0 && !/<img|<video|<iframe/i.test(value);

  const toolbarBtn = (
    key: string,
    title: string,
    icon: React.ReactNode,
    command: string,
    arg?: string
  ) => (
    <Tooltip title={title} key={key}>
      <Button
        data-e2e-id={dataE2eId ? `${dataE2eId}-${key}-btn` : undefined}
        size="small"
        type={marks[command] ? 'primary' : 'text'}
        disabled={disabled || sourceMode}
        icon={icon}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec(command, arg)}
      />
    </Tooltip>
  );

  return (
    <div
      data-e2e-id={dataE2eId}
      id={id}
      style={{
        border: `1px solid ${focused ? token.colorPrimary : token.colorBorder}`,
        borderRadius: token.borderRadius,
        overflow: 'hidden',
        transition: 'border-color .2s',
        background: token.colorBgContainer,
      }}
    >
      <style>{CONTENT_CSS}</style>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          padding: '4px 8px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorFillQuaternary,
        }}
      >
        <Select
          data-e2e-id={dataE2eId ? `${dataE2eId}-block-select` : undefined}
          size="small"
          style={{ width: 108 }}
          value={block}
          options={BLOCK_OPTIONS}
          disabled={disabled || sourceMode}
          onMouseDown={saveSelection}
          onChange={(v) => exec('formatBlock', `<${v}>`)}
        />
        <Divider type="vertical" style={{ margin: '0 4px' }} />

        {toolbarBtn('bold', '粗體', <BoldOutlined />, 'bold')}
        {toolbarBtn('italic', '斜體', <ItalicOutlined />, 'italic')}
        {toolbarBtn('underline', '底線', <UnderlineOutlined />, 'underline')}
        {toolbarBtn('strike', '刪除線', <StrikethroughOutlined />, 'strikeThrough')}

        <Tooltip title="文字顏色">
          <span onMouseDown={saveSelection}>
            <ColorPicker
              size="small"
              presets={COLOR_PRESETS}
              disabled={disabled || sourceMode}
              onChangeComplete={(color) => exec('foreColor', color.toHexString())}
            >
              <Button
                data-e2e-id={dataE2eId ? `${dataE2eId}-color-btn` : undefined}
                size="small"
                type="text"
                disabled={disabled || sourceMode}
                icon={<FontColorsOutlined />}
              />
            </ColorPicker>
          </span>
        </Tooltip>
        <Divider type="vertical" style={{ margin: '0 4px' }} />

        {toolbarBtn('ul', '項目符號', <UnorderedListOutlined />, 'insertUnorderedList')}
        {toolbarBtn('ol', '編號清單', <OrderedListOutlined />, 'insertOrderedList')}
        {toolbarBtn('align-left', '靠左對齊', <AlignLeftOutlined />, 'justifyLeft')}
        {toolbarBtn('align-center', '置中對齊', <AlignCenterOutlined />, 'justifyCenter')}
        {toolbarBtn('align-right', '靠右對齊', <AlignRightOutlined />, 'justifyRight')}
        <Divider type="vertical" style={{ margin: '0 4px' }} />

        <Popover
          open={linkOpen}
          onOpenChange={(open) => {
            if (open) saveSelection();
            else setLinkError('');
            setLinkOpen(open);
          }}
          trigger="click"
          title="插入連結"
          content={
            <div>
              <Space.Compact>
                <Input
                  data-e2e-id={dataE2eId ? `${dataE2eId}-link-input` : undefined}
                  size="small"
                  style={{ width: 240 }}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onPressEnter={handleInsertLink}
                />
                <Button
                  data-e2e-id={dataE2eId ? `${dataE2eId}-link-confirm-btn` : undefined}
                  size="small"
                  type="primary"
                  onClick={handleInsertLink}
                >
                  確定
                </Button>
              </Space.Compact>
              {linkError && (
                <div style={{ marginTop: 4, fontSize: 12, color: token.colorError }}>
                  {linkError}
                </div>
              )}
            </div>
          }
        >
          <Tooltip title="插入連結">
            <Button
              data-e2e-id={dataE2eId ? `${dataE2eId}-link-btn` : undefined}
              size="small"
              type="text"
              disabled={disabled || sourceMode}
              icon={<LinkOutlined />}
            />
          </Tooltip>
        </Popover>

        <Tooltip title="清除格式">
          <Button
            data-e2e-id={dataE2eId ? `${dataE2eId}-clear-format-btn` : undefined}
            size="small"
            type="text"
            disabled={disabled || sourceMode}
            icon={<ClearOutlined />}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              exec('removeFormat');
              exec('unlink');
            }}
          />
        </Tooltip>
        {toolbarBtn('undo', '復原', <UndoOutlined />, 'undo')}
        {toolbarBtn('redo', '重做', <RedoOutlined />, 'redo')}

        <div style={{ flex: 1 }} />
        <Tooltip title={sourceMode ? '回到編輯模式' : '編輯 HTML 原始碼'}>
          <Button
            data-e2e-id={dataE2eId ? `${dataE2eId}-source-toggle-btn` : undefined}
            size="small"
            type={sourceMode ? 'primary' : 'text'}
            disabled={disabled}
            icon={<CodeOutlined />}
            onClick={() => setSourceMode((s) => !s)}
          />
        </Tooltip>
      </div>

      {sourceMode ? (
        <Input.TextArea
          data-e2e-id={dataE2eId ? `${dataE2eId}-source-textarea` : undefined}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          autoSize={{ minRows: Math.max(6, Math.round(minHeight / 24)) }}
          style={{ border: 'none', borderRadius: 0, fontFamily: 'monospace', fontSize: 12 }}
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            data-e2e-id={dataE2eId ? `${dataE2eId}-editable` : undefined}
            ref={editorRef}
            className="vip-rte-content"
            contentEditable={!disabled}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-required={ariaRequired}
            style={{
              minHeight,
              maxHeight: 360,
              overflowY: 'auto',
              padding: '10px 12px',
              fontSize: 14,
              lineHeight: 1.6,
              color: disabled ? token.colorTextDisabled : token.colorText,
              background: disabled ? token.colorBgContainerDisabled : undefined,
              cursor: disabled ? 'not-allowed' : 'text',
            }}
            onInput={emitChange}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={() => {
              composingRef.current = false;
              emitChange();
            }}
            onBlur={() => {
              setFocused(false);
              saveSelection();
              emitChange();
            }}
            onFocus={() => {
              setFocused(true);
              syncToolbarState();
            }}
            onKeyUp={() => {
              saveSelection();
              syncToolbarState();
            }}
            onMouseUp={() => {
              saveSelection();
              syncToolbarState();
            }}
            onPaste={handlePaste}
          />
          {showPlaceholder && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 12,
                fontSize: 14,
                lineHeight: 1.6,
                color: token.colorTextPlaceholder,
                pointerEvents: 'none',
              }}
            >
              {placeholder}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '2px 10px',
          fontSize: 12,
          color: overLimit ? token.colorError : token.colorTextTertiary,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorFillQuaternary,
        }}
      >
        {typeof maxLength === 'number' ? `${plainLength} / ${maxLength} 字` : `${plainLength} 字`}
      </div>
    </div>
  );
}
