import { COLOR_META, FACE_ORDER, PAINT_HINTS, PAINT_SEQUENCE } from '../cube/constants.js';
import { composePreview } from '../cube/preview.js';
import { useStore } from '../store/useStore.js';

function MiniFace({ face, facelets, current }) {
  const offset = FACE_ORDER.indexOf(face) * 9;
  const cells = facelets.slice(offset, offset + 9).split('');
  return (
    <div className={`mini ${face.toLowerCase()} ${current ? 'now' : ''}`}>
      {cells.map((ch, i) => (
        <b key={i} style={{ background: COLOR_META[ch]?.sticker || '#1a1a1e' }} />
      ))}
    </div>
  );
}

export default function FacePainter() {
  const paintIndex = useStore((s) => s.paintIndex);
  const paintDraft = useStore((s) => s.paintDraft);
  const painted = useStore((s) => s.painted);
  const paintBrush = useStore((s) => s.paintBrush);
  const setPaintBrush = useStore((s) => s.setPaintBrush);
  const paintCell = useStore((s) => s.paintCell);
  const lockFace = useStore((s) => s.lockFace);
  const backFace = useStore((s) => s.backFace);
  const jumpPaintFace = useStore((s) => s.jumpPaintFace);

  const face = PAINT_SEQUENCE[paintIndex];
  const preview = composePreview({ ...painted, [face]: paintDraft });

  return (
    <div>
      <p className="kicker">Face {paintIndex + 1} of 6 · {COLOR_META[face].name}</p>
      <h2>Color the {face === 'U' ? 'up' : face === 'D' ? 'down' : face === 'F' ? 'front' : face === 'B' ? 'back' : face === 'R' ? 'right' : 'left'} face</h2>
      <p className="lede">{PAINT_HINTS[face]}</p>

      <div className="progress">
        {PAINT_SEQUENCE.map((f, i) => (
          <i
            key={f}
            className={i < paintIndex ? 'on' : i === paintIndex ? 'now' : ''}
            onClick={() => jumpPaintFace(i)}
          />
        ))}
      </div>

      <div className="painter">
        <div className="face-grid" aria-label={`${face} face painter`}>
          {paintDraft.split('').map((ch, i) => (
            <button
              key={i}
              type="button"
              className={`cell ${i === 4 ? 'center' : ''}`}
              style={{ background: COLOR_META[ch]?.sticker || '#1a1a1e' }}
              onClick={() => paintCell(i)}
              aria-label={i === 4 ? 'Center' : `Sticker ${i + 1}`}
            />
          ))}
        </div>
        <div className="palette">
          {FACE_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              className={`swatch ${paintBrush === id ? 'on' : ''}`}
              style={{ background: COLOR_META[id].sticker }}
              onClick={() => setPaintBrush(id)}
              aria-label={COLOR_META[id].name}
            />
          ))}
        </div>
        <div className="net" aria-hidden="true">
          {FACE_ORDER.map((f) => (
            <MiniFace key={f} face={f} facelets={preview} current={f === face} />
          ))}
        </div>
      </div>

      <div className="sheet-foot" style={{ padding: '18px 0 0', border: 0 }}>
        <button type="button" className="ghost" onClick={backFace}>
          Back
        </button>
        <button type="button" className="solid" onClick={lockFace}>
          {paintIndex === 5 ? 'Solve' : 'Lock face'}
        </button>
      </div>
    </div>
  );
}
