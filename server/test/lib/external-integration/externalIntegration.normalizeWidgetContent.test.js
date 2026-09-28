const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const logger = require('../../../utils/logger');
const { ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { ERROR_MESSAGES } = require('../../../utils/constants');
const {
  normalizeWidgetContent,
  collectImageKeys,
  findWidgetAction,
} = require('../../../lib/external-integration/externalIntegration.normalizeWidgetContent');

const normalize = (components, envelope = {}) => normalizeWidgetContent({ components, ...envelope }).components;

const expectInvalid = (payload, message = 'EXTERNAL_INTEGRATION_INVALID_WIDGET_CONTENT') => {
  try {
    normalizeWidgetContent(payload);
    throw new Error('should have thrown');
  } catch (e) {
    expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
    expect(e.message).to.equal(message);
  }
};

describe('externalIntegration.normalizeWidgetContent', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('envelope', () => {
    it('should reject a content that is not an object or has no components array', () => {
      expectInvalid(null);
      expectInvalid([]);
      expectInvalid('content');
      expectInvalid({ version: 1 });
      expectInvalid({ components: 'nope' });
    });

    it('should default the version to 1 and refuse a newer one with the dedicated code', () => {
      expect(normalizeWidgetContent({ components: [] }).version).to.equal(1);
      expectInvalid({ version: 2, components: [] }, ERROR_MESSAGES.WIDGET_CONTENT_VERSION_UNSUPPORTED);
      expectInvalid({ version: '1', components: [] });
      expectInvalid({ version: 0, components: [] });
    });

    it('should clamp ttl_seconds to 10-3600 and default it to 60', () => {
      expect(normalizeWidgetContent({ components: [] }).ttl_seconds).to.equal(60);
      expect(normalizeWidgetContent({ components: [], ttl_seconds: 2 }).ttl_seconds).to.equal(10);
      expect(normalizeWidgetContent({ components: [], ttl_seconds: 99999 }).ttl_seconds).to.equal(3600);
      expect(normalizeWidgetContent({ components: [], ttl_seconds: 300.4 }).ttl_seconds).to.equal(300);
      expect(normalizeWidgetContent({ components: [], ttl_seconds: '300' }).ttl_seconds).to.equal(60);
    });

    it('should refuse a raw content above 256 KB, counted in UTF-8 bytes', () => {
      const description = 'x'.repeat(300 * 1024);
      expectInvalid({ components: [{ type: 'card-list', items: [{ title: 'Big', description }] }] });
      // 140 K characters but 280 KB once encoded: the bound is on bytes
      const multibyte = 'é'.repeat(140 * 1024);
      expectInvalid({ components: [{ type: 'card-list', items: [{ title: 'Big', description: multibyte }] }] });
    });

    it('should accept an empty components array', () => {
      expect(normalizeWidgetContent({ components: [] }).components).to.deep.equal([]);
    });

    it('should drop unknown component types, non-object components and unknown fields with a warning', () => {
      const warn = sinon.stub(logger, 'warn');
      const components = normalize([
        { type: 'hologram', text: 'hi' },
        42,
        { type: 'text', text: 'Hello', variant: 'heading', color: 'red', extra: true },
      ]);
      expect(components).to.deep.equal([{ type: 'text', variant: 'heading', text: 'Hello' }]);
      expect(warn.callCount).to.equal(2);
      expect(warn.firstCall.args[0]).to.include('unknown type "hologram"');
    });
  });

  describe('text', () => {
    it('should bound each variant and keep line breaks only in body', () => {
      // two texts per widget at most: normalized in separate contents
      const [heading, caption] = normalize([
        { type: 'text', variant: 'heading', text: `Line 1\nLine 2 ${'x'.repeat(50)}` },
        { type: 'text', variant: 'caption', text: { en: 'A\tB', fr: '  C  ' } },
      ]);
      const [body] = normalize([
        { type: 'text', variant: 'body', text: `Para 1\r\n\n\n\n\nPara 2${String.fromCharCode(7)}` },
      ]);
      const [defaulted] = normalize([{ type: 'text', text: 'Body by default' }]);
      expect(heading.text).to.have.lengthOf(40);
      expect(heading.text.endsWith('…')).to.equal(true);
      expect(heading.text.startsWith('Line 1 Line 2')).to.equal(true);
      expect(caption.text).to.deep.equal({ en: 'A B', fr: 'C' });
      expect(body.text).to.equal('Para 1\n\nPara 2');
      expect(defaulted.variant).to.equal('body');
    });

    it('should drop a text without a usable text field', () => {
      expect(
        normalize([
          { type: 'text' },
          { type: 'text', text: '   ' },
          { type: 'text', text: { fr: 'Sans anglais' } },
          { type: 'text', text: { en: 42 } },
          { type: 'text', text: { 'not a language': 'x', en: 'ok' } },
        ]),
      ).to.deep.equal([{ type: 'text', variant: 'body', text: { en: 'ok' } }]);
    });
  });

  describe('value and gauge tiles', () => {
    it('should normalize an inline value with its label, unit, icon and color', () => {
      expect(
        normalize([
          { type: 'value', value: 82, label: 'Battery', unit: '%', icon: 'battery', color: 'success' },
          { type: 'value', value: 'Docked', label: { en: 'x'.repeat(30) }, unit: 'kWh/day', icon: 'Bad Icon' },
          { type: 'value', value: Infinity },
          { type: 'value', value: true },
          { type: 'value' },
        ]),
      ).to.deep.equal([
        { type: 'value', value: 82, label: 'Battery', unit: '%', icon: 'battery', color: 'success' },
        { type: 'value', value: 'Docked', label: { en: `${'x'.repeat(23)}…` }, unit: 'kWh/d…' },
      ]);
    });

    it('should keep a device_feature reference in place of the value, dropping non-string ones', () => {
      expect(
        normalize([
          { type: 'value', device_feature: 'ext:demo:battery', value: 12, unit: '%', label: 'Battery' },
          { type: 'value', device_feature: { external_id: 'ext:demo:battery' } },
          { type: 'value', device_feature: 42 },
        ]),
      ).to.deep.equal([{ type: 'value', device_feature: 'ext:demo:battery', label: 'Battery' }]);
    });

    it('should require a finite value and a valid range on an inline gauge', () => {
      expect(
        normalize([
          { type: 'gauge', value: 42, min: 0, max: 100, label: 'Level', unit: '%', color: 'info' },
          { type: 'gauge', value: 42, min: 100, max: 0 },
          { type: 'gauge', value: 42, min: 0 },
          { type: 'gauge', value: 'x', min: 0, max: 100 },
        ]),
      ).to.deep.equal([{ type: 'gauge', value: 42, min: 0, max: 100, label: 'Level', unit: '%', color: 'info' }]);
    });

    it('should keep the declared range of a device-bound gauge only when valid', () => {
      expect(
        normalize([
          { type: 'gauge', device_feature: 'ext:demo:battery', min: 0, max: 100 },
          { type: 'gauge', device_feature: 'ext:demo:battery', min: 5 },
          { type: 'gauge', device_feature: null },
        ]),
      ).to.deep.equal([
        { type: 'gauge', device_feature: 'ext:demo:battery', min: 0, max: 100 },
        { type: 'gauge', device_feature: 'ext:demo:battery' },
      ]);
    });
  });

  describe('status', () => {
    it('should bound the items to 10 and drop invalid rows', () => {
      const items = Array.from({ length: 12 }, (value, index) => ({ label: `Row ${index}`, value: index }));
      const [component] = normalize([{ type: 'status', items }]);
      expect(component.items).to.have.lengthOf(10);
      expect(component.items[0]).to.deep.equal({ label: 'Row 0', value: 0 });
      expect(
        normalize([
          {
            type: 'status',
            items: [
              { label: 'State', value: { en: 'Docked' }, color: 'success', icon: 'home' },
              { label: 'No value' },
              { value: 'No label' },
              null,
              { label: 'x'.repeat(50), value: 'y'.repeat(50) },
            ],
          },
        ])[0].items,
      ).to.deep.equal([
        { label: 'State', value: { en: 'Docked' }, icon: 'home', color: 'success' },
        { label: `${'x'.repeat(39)}…`, value: `${'y'.repeat(39)}…` },
      ]);
    });

    it('should drop a status without valid items', () => {
      expect(
        normalize([{ type: 'status', items: [] }, { type: 'status', items: 'nope' }, { type: 'status' }]),
      ).to.deep.equal([]);
    });
  });

  describe('chart', () => {
    it('should normalize inline series, capping series and points', () => {
      const points = Array.from({ length: 301 }, (value, index) => ({
        t: `2026-09-18T${String(index % 24).padStart(2, '0')}:00:00Z`,
        v: index,
      }));
      const series = Array.from({ length: 5 }, (value, index) => ({ name: `Series ${index}`, points }));
      const [component] = normalize([{ type: 'chart', series, chart_type: 'area', title: 'Forecast', unit: 'kW' }]);
      expect(component.series).to.have.lengthOf(4);
      expect(component.series[0].points).to.have.lengthOf(300);
      expect(component.series[0].points[0]).to.deep.equal({ t: '2026-09-18T00:00:00.000Z', v: 0 });
      expect(component).to.include({ type: 'chart', chart_type: 'area', title: 'Forecast', unit: 'kW' });
    });

    it('should drop invalid points and empty series, and default the chart type', () => {
      const [component] = normalize([
        {
          type: 'chart',
          chart_type: 'pie',
          series: [
            {
              points: [
                { t: 'not a date', v: 1 },
                { t: '2026-09-18T10:00:00Z', v: 'x' },
                null,
                { t: '2026-09-18T10:00:00Z', v: 2 },
              ],
            },
            { name: 'Empty', points: [] },
            'nope',
          ],
        },
      ]);
      expect(component).to.deep.equal({
        type: 'chart',
        chart_type: 'line',
        series: [{ points: [{ t: '2026-09-18T10:00:00.000Z', v: 2 }] }],
      });
      expect(normalize([{ type: 'chart', series: [] }, { type: 'chart' }])).to.deep.equal([]);
    });

    it('should normalize live device_features with the chart box interval', () => {
      // one focal component per widget: each chart normalized on its own
      const normalizeOne = (component) => normalize([component]);
      expect(
        normalizeOne({
          type: 'chart',
          device_features: ['ext:a', 'ext:b', 'ext:c', 'ext:d', 'ext:e'],
          interval: 'last-week',
        }),
      ).to.deep.equal([
        {
          type: 'chart',
          chart_type: 'line',
          device_features: ['ext:a', 'ext:b', 'ext:c', 'ext:d'],
          interval: 'last-week',
        },
      ]);
      expect(normalizeOne({ type: 'chart', device_features: ['ext:a'], interval: 'yesterday' })).to.deep.equal([
        { type: 'chart', chart_type: 'line', device_features: ['ext:a'], interval: 'last-day' },
      ]);
      expect(normalizeOne({ type: 'chart', device_features: ['ext:a', 42] })).to.deep.equal([]);
      expect(normalizeOne({ type: 'chart', device_features: [] })).to.deep.equal([]);
    });

    it('should normalize annotations and the now marker on both chart forms', () => {
      const points = [{ t: '2026-09-19T00:00:00Z', v: 3.2 }];
      const annotations = Array.from({ length: 9 }, (value, index) => ({
        t: `2026-09-19T${String(index).padStart(2, '0')}:48:00Z`,
        value: 10.69,
        label: { en: `High tide ${index}`, fr: `PM ${index}` },
        color: 'primary',
      }));
      const [inline] = normalize([{ type: 'chart', series: [{ points }], annotations, now_marker: true }]);
      // capped at 8, label bounded to 16 characters per language value
      expect(inline.annotations).to.have.lengthOf(8);
      expect(inline.annotations[0]).to.deep.equal({
        t: '2026-09-19T00:48:00.000Z',
        value: 10.69,
        label: { en: 'High tide 0', fr: 'PM 0' },
        color: 'primary',
      });
      expect(inline.now_marker).to.equal(true);
      const [live] = normalize([
        {
          type: 'chart',
          device_features: ['ext:tide:height'],
          annotations: [
            // a time alone is a vertical marker; the rest is optional
            { t: '2026-09-19T13:59:00Z' },
            { t: '2026-09-19T20:12:00Z', label: 'Low tide, coefficient 74', color: 'rainbow', value: 'x' },
            // dropped: no valid time, not an object
            { value: 1, label: 'no time' },
            { t: 'yesterday' },
            'nope',
            null,
          ],
          now_marker: 'yes',
        },
      ]);
      expect(live.annotations).to.deep.equal([
        { t: '2026-09-19T13:59:00.000Z' },
        { t: '2026-09-19T20:12:00.000Z', label: 'Low tide, coeff…' },
      ]);
      // anything but `true` is no marker; no field when nothing survived
      expect(live).to.not.have.property('now_marker');
      const [bare] = normalize([{ type: 'chart', series: [{ points }], annotations: [{ t: 'nope' }], now_marker: 1 }]);
      expect(bare).to.deep.equal({
        type: 'chart',
        chart_type: 'line',
        series: [{ points: [{ t: '2026-09-19T00:00:00.000Z', v: 3.2 }] }],
      });
      const [notArray] = normalize([{ type: 'chart', series: [{ points }], annotations: { t: '2026-09-19' } }]);
      expect(notArray).to.not.have.property('annotations');
    });
  });

  describe('card-list', () => {
    it('should normalize items with their optional fields, https links only', () => {
      const [component] = normalize([
        {
          type: 'card-list',
          display: 'grid',
          items: [
            {
              title: "L'Odyssée",
              subtitle: 'Drama',
              date: '2026-10-07',
              image: 'poster-20637522',
              badge: { text: 'New', color: 'info' },
              description: 'Line 1\n\n\n\nLine 2',
              links: [
                { url: 'https://www.youtube.com/watch?v=1', label: 'Trailer' },
                { url: 'http://insecure.example', label: 'Nope' },
                { url: 'https://a.example' },
                { url: 'https://b.example' },
                { url: 'https://c.example' },
              ],
            },
            { title: 'Minimal', image: 'Bad Key', badge: { color: 'info' }, links: 'nope' },
            { subtitle: 'No title' },
            null,
          ],
        },
      ]);
      expect(component.display).to.equal('grid');
      expect(component.items).to.deep.equal([
        {
          title: "L'Odyssée",
          subtitle: 'Drama',
          date: '2026-10-07T00:00:00.000Z',
          image: 'poster-20637522',
          badge: { text: 'New', color: 'info' },
          description: 'Line 1\n\nLine 2',
          links: [
            { url: 'https://www.youtube.com/watch?v=1', label: 'Trailer' },
            { url: 'https://a.example/' },
            { url: 'https://b.example/' },
          ],
        },
        { title: 'Minimal' },
      ]);
    });

    it('should cap the items at 12 in grid and 8 in list, defaulting to list', () => {
      const items = Array.from({ length: 15 }, (value, index) => ({ title: `Item ${index}` }));
      const [grid] = normalize([{ type: 'card-list', display: 'grid', items }]);
      const [list] = normalize([{ type: 'card-list', display: 'carousel', items }]);
      expect(grid.items).to.have.lengthOf(12);
      expect(list.display).to.equal('list');
      expect(list.items).to.have.lengthOf(8);
    });

    it('should drop a card-list without valid items', () => {
      expect(normalize([{ type: 'card-list', items: [{ subtitle: 'x' }] }, { type: 'card-list' }])).to.deep.equal([]);
    });

    it('should drop links that are too long or not https URLs', () => {
      const [component] = normalize([
        {
          type: 'card-list',
          items: [
            {
              title: 'Links',
              links: [
                { url: `https://x.example/${'a'.repeat(2100)}` },
                { url: 'https://' },
                { url: 42 },
                // credentials never reach a dashboard link
                { url: 'https://user:pass@evil.example/path' },
                { url: 'https://:token@evil.example/' },
              ],
            },
          ],
        },
      ]);
      expect(component.items[0]).to.deep.equal({ title: 'Links' });
    });
  });

  describe('image', () => {
    it('should require a valid key and default the fit to cover', () => {
      expect(normalize([{ type: 'image', key: 'cleaning-map-3f9a2c', alt: 'Map', fit: 'contain' }])).to.deep.equal([
        { type: 'image', key: 'cleaning-map-3f9a2c', fit: 'contain', alt: 'Map' },
      ]);
      expect(normalize([{ type: 'image', key: 'map', fit: 'stretch' }])).to.deep.equal([
        { type: 'image', key: 'map', fit: 'cover' },
      ]);
      expect(normalize([{ type: 'image', key: '-bad' }, { type: 'image' }])).to.deep.equal([]);
    });
  });

  describe('button', () => {
    it('should accept exactly one kind: action, device_feature + value, or link', () => {
      expect(
        normalize([
          {
            type: 'button',
            label: 'Start',
            style: 'primary',
            icon: 'play',
            action: { key: 'start', params: { mode: 'full' }, confirm: true },
          },
          { type: 'button', label: 'Dock', device_feature: 'ext:demo:dock', value: 1 },
          { type: 'button', label: 'Site', link: { url: 'https://example.com', label: 'ignored' } },
          { type: 'button', label: 'Two kinds', action: { key: 'a' }, link: { url: 'https://example.com' } },
          { type: 'button', label: 'No kind' },
          { type: 'button', action: { key: 'no_label' } },
        ]),
      ).to.deep.equal([
        {
          type: 'button',
          label: 'Start',
          style: 'primary',
          icon: 'play',
          action: { key: 'start', params: { mode: 'full' }, confirm: true },
        },
        { type: 'button', label: 'Dock', style: 'secondary', device_feature: 'ext:demo:dock', value: 1 },
        { type: 'button', label: 'Site', style: 'secondary', link: { url: 'https://example.com/' } },
      ]);
    });

    it('should validate the action key, params size and confirm flag', () => {
      expect(
        normalize([
          { type: 'button', label: 'Bad key', action: { key: 'Start!' } },
          { type: 'button', label: 'Not object', action: 'start' },
          { type: 'button', label: 'Big params', action: { key: 'big', params: { blob: 'x'.repeat(1100) } } },
          // 600 characters, 1200 bytes: the params bound counts UTF-8 bytes
          { type: 'button', label: 'Multibyte', action: { key: 'wide', params: { blob: 'é'.repeat(600) } } },
          { type: 'button', label: 'Defaults', action: { key: 'ok', params: 'nope', confirm: 'yes' } },
        ]),
      ).to.deep.equal([
        { type: 'button', label: 'Defaults', style: 'secondary', action: { key: 'ok', params: {}, confirm: false } },
      ]);
    });

    it('should drop device feature buttons without a numeric value and links that are not https', () => {
      expect(
        normalize([
          { type: 'button', label: 'Dock', device_feature: 'ext:demo:dock' },
          { type: 'button', label: 'Dock', device_feature: { id: 1 }, value: 1 },
          { type: 'button', label: 'Site', link: { url: 'http://example.com' } },
          { type: 'button', label: 'Site', link: 'https://example.com' },
        ]),
      ).to.deep.equal([]);
    });
  });

  describe('content budget', () => {
    const tile = (index) => ({ type: 'value', value: index, label: `Tile ${index}` });
    const button = (key) => ({ type: 'button', label: key, action: { key } });

    it('should keep at most 8 components, in content order', () => {
      const warn = sinon.stub(logger, 'warn');
      const components = normalize([
        ...Array.from({ length: 6 }, (value, index) => tile(index)),
        { type: 'text', variant: 'heading', text: 'Title' },
        button('go'),
        button('stop'),
        { type: 'text', variant: 'caption', text: 'Dropped' },
      ]);
      expect(components).to.have.lengthOf(8);
      expect(components[7]).to.deep.include({ type: 'button', label: 'go' });
      expect(warn.callCount).to.equal(2);
      expect(warn.firstCall.args[0]).to.include('more than 8 components');
    });

    it('should keep one focal component and one status list', () => {
      const chart = { type: 'chart', series: [{ points: [{ t: '2026-09-18T10:00:00Z', v: 1 }] }] };
      const cardList = { type: 'card-list', items: [{ title: 'Movie' }] };
      const image = { type: 'image', key: 'map' };
      const status = { type: 'status', items: [{ label: 'State', value: 'Docked' }] };
      [
        [chart, chart],
        [chart, cardList],
        [image, cardList],
      ].forEach((pair) => {
        const components = normalize(pair);
        expect(components).to.have.lengthOf(1);
        expect(components[0].type).to.equal(pair[0].type);
      });
      expect(normalize([status, status])).to.have.lengthOf(1);
      // a status list is not a focal component: both fit in one card
      expect(normalize([status, chart]).map((component) => component.type)).to.deep.equal(['status', 'chart']);
    });

    it('should keep at most 6 tiles, 2 texts (one body) and 4 buttons', () => {
      const tiles = normalize(Array.from({ length: 7 }, (value, index) => tile(index)));
      expect(tiles).to.have.lengthOf(6);
      expect(tiles[5].label).to.equal('Tile 5');
      const texts = normalize([
        { type: 'text', variant: 'heading', text: 'A' },
        { type: 'text', variant: 'caption', text: 'B' },
        { type: 'text', variant: 'caption', text: 'C' },
      ]);
      expect(texts.map((component) => component.text)).to.deep.equal(['A', 'B']);
      const bodies = normalize([
        { type: 'text', variant: 'body', text: 'A' },
        { type: 'text', variant: 'body', text: 'B' },
      ]);
      expect(bodies.map((component) => component.text)).to.deep.equal(['A']);
      const buttons = normalize(['aa', 'bb', 'cc', 'dd', 'ee'].map(button));
      expect(buttons.map((component) => component.label)).to.deep.equal(['aa', 'bb', 'cc', 'dd']);
    });

    it('should drop a button whose action key duplicates an earlier one', () => {
      const components = normalize([button('start'), { ...button('start'), label: 'Again' }]);
      expect(components).to.have.lengthOf(1);
      expect(components[0].label).to.equal('start');
    });

    it('should preserve the content order (the canonical slots are applied at render time)', () => {
      const components = normalize([button('go'), { type: 'text', variant: 'heading', text: 'Title' }, tile(1)]);
      expect(components.map((component) => component.type)).to.deep.equal(['button', 'text', 'value']);
    });
  });

  describe('helpers', () => {
    it('should collect the image keys of a content and find an action by key', () => {
      const { components } = normalizeWidgetContent({
        components: [
          {
            type: 'card-list',
            items: [{ title: 'A', image: 'poster-1' }, { title: 'B', image: 'poster-1' }, { title: 'C' }],
          },
          { type: 'button', label: 'Start', action: { key: 'start', params: { mode: 'full' } } },
        ],
      });
      expect(collectImageKeys(components)).to.deep.equal(['poster-1']);
      expect(collectImageKeys(normalize([{ type: 'image', key: 'map' }]))).to.deep.equal(['map']);
      expect(findWidgetAction(components, 'start')).to.deep.equal({
        key: 'start',
        params: { mode: 'full' },
        confirm: false,
      });
      expect(findWidgetAction(components, 'stop')).to.equal(null);
    });
  });
});
