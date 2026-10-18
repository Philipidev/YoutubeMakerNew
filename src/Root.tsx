import React from "react";
import { Composition, Folder } from "remotion";
import { FPS } from "./theme";
import { EpisodioVideo } from "./video/Episodio";
import { EpisodioPropsSchema, calcularMetadataEpisodio, type EpisodioProps } from "./video/dados";
import { DesignSystem } from "./studio/DesignSystem";

const padrao: EpisodioProps = { slug: "exemplo", legendaQueimada: false, semAudio: false };

export const Root: React.FC = () => (
  <>
    <Composition
      id="Vertical"
      component={EpisodioVideo}
      schema={EpisodioPropsSchema}
      defaultProps={padrao}
      calculateMetadata={calcularMetadataEpisodio}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={300}
    />
    <Composition
      id="Horizontal"
      component={EpisodioVideo}
      schema={EpisodioPropsSchema}
      defaultProps={padrao}
      calculateMetadata={calcularMetadataEpisodio}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={300}
    />
    <Folder name="Studio">
      <Composition id="DesignSystem" component={DesignSystem} width={1080} height={1920} fps={FPS} durationInFrames={150} />
      <Composition id="DesignSystemHorizontal" component={DesignSystem} width={1920} height={1080} fps={FPS} durationInFrames={150} />
    </Folder>
  </>
);
