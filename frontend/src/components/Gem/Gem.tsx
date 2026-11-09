/**
 * 보석 아이콘
 * (원본 디자인: Gem.dc.html)
 */
import { Component, Fragment } from "react";
import { css } from "@/lib/css";
import { img } from "@/assets";

export default class Gem extends Component<any, any> {
  [key: string]: any;

  renderVals() {
    const kind = this.props.kind ?? "dia";
    const size = Number(this.props.size ?? 96) || 96;
    const soft = this.props.soft === true || this.props.soft === "true";
    return {
      px: size + "px",
      opacity: soft ? "0.55" : "1",
      isOpal: kind === "opal",
      isAqua: kind === "aqua",
      isAme: kind === "ame",
      isSap: kind === "sap",
      isDia: kind === "dia",
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <span
        style={css(
          `display: inline-flex; flex: none; width: ${v.px}; height: ${v.px}; opacity: ${v.opacity}`,
        )}
      >
        {v.isOpal ? (
          <img
            src={img.gemOpal}
            alt=""
            draggable="false"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "3%",
              boxSizing: "border-box",
              filter: "drop-shadow(0 3px 4px rgba(60,72,130,.22))",
            }}
          />
        ) : null}{" "}
        {v.isAqua ? (
          <img
            src={img.gemAqua}
            alt=""
            draggable="false"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "3%",
              boxSizing: "border-box",
              filter: "drop-shadow(0 3px 4px rgba(60,72,130,.22))",
            }}
          />
        ) : null}{" "}
        {v.isAme ? (
          <img
            src={img.gemAmethyst}
            alt=""
            draggable="false"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "3%",
              boxSizing: "border-box",
              filter: "drop-shadow(0 3px 4px rgba(60,72,130,.22))",
            }}
          />
        ) : null}{" "}
        {v.isSap ? (
          <img
            src={img.gemSapphire}
            alt=""
            draggable="false"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "3%",
              boxSizing: "border-box",
              filter: "drop-shadow(0 3px 4px rgba(60,72,130,.22))",
            }}
          />
        ) : null}{" "}
        {v.isDia ? (
          <img
            src={img.gemDiamond}
            alt=""
            draggable="false"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "3%",
              boxSizing: "border-box",
              filter: "drop-shadow(0 3px 4px rgba(60,72,130,.22))",
            }}
          />
        ) : null}
      </span>
    );
  }
}
