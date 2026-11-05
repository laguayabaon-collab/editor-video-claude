import { Composition } from "remotion";
import data from "./edit-data.json";
import { EDIT_DURATION, VideoEdit } from "./VideoEdit";

export const MyComposition = () => {
  return (
    <Composition
      id="VideoEdit"
      component={VideoEdit}
      durationInFrames={EDIT_DURATION}
      fps={data.fps}
      width={data.width}
      height={data.height}
    />
  );
};
