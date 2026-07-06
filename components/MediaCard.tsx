import type { MediaCard as MediaCardType } from "@/lib/content";
import { LazyVideo } from "./LazyVideo";
import { FigmaButton, Pill } from "./Pill";

export function MediaCard({ card }: { card: MediaCardType }) {
  return (
    <article className="media-card">
      {card.video && (
        <div
          className={`media-card__media${card.zoomVideo ? " media-card__media--zoom" : ""}`}
        >
          <LazyVideo
            src={card.video}
            poster={card.video.replace("/videos/", "/images/posters/").replace(".mp4", ".jpg")}
          />
        </div>
      )}
      {card.image && (
        <div className="media-card__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image} alt={card.title || card.text} />
        </div>
      )}
      <div className="media-card__info">
        <div className="media-card__tag-row">
          <Pill color={card.tagColor}>{card.tag}</Pill>
          {card.figmaButton && <FigmaButton />}
        </div>
        <div className="media-card__texts">
          {card.title && <h3 className="media-card__title">{card.title}</h3>}
          <p className="body-16">{card.text}</p>
        </div>
      </div>
    </article>
  );
}
