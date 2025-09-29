// Torrent utility class
export class TorrentUtils {
  // Parse torrent file for metadata
  static async parseTorrentFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    try {
      const [torrent] = TorrentUtils.decodeBencode(data);
      return {
        name: torrent.info?.name || file.name,
        comment: torrent.comment || "",
        files: torrent.info?.files?.map((f) => ({
          path: f.path.join("/"),
          length: f.length,
        })) || [
          {
            path: torrent.info?.name || file.name,
            length: torrent.info?.length,
          },
        ],
      };
    } catch (e) {
      console.warn("Could not parse torrent file:", e);
      return { name: file.name, comment: "", files: [] };
    }
  }

  static parseCommentVariables(comment) {
    if (!comment || typeof comment !== "string") return {};

    const variables = {};
    const pairs = comment.split(";");

    for (const pair of pairs) {
      const trimmedPair = pair.trim();
      if (!trimmedPair) continue;

      const eqIndex = trimmedPair.indexOf("=");
      if (eqIndex === -1) continue;

      const key = trimmedPair.substring(0, eqIndex).trim();
      const value = trimmedPair.substring(eqIndex + 1).trim();

      if (key) {
        variables[`_${key}`] = value;
      }
    }

    return variables;
  }

  // Simple bencode decoder
  static decodeBencode(data, offset = 0) {
    const char = String.fromCharCode(data[offset]);

    if (char === "d") {
      const dict = {};
      offset++;
      while (data[offset] !== 101) {
        const [key, newOffset1] = TorrentUtils.decodeBencode(data, offset);
        const [value, newOffset2] = TorrentUtils.decodeBencode(
          data,
          newOffset1,
        );
        dict[key] = value;
        offset = newOffset2;
      }
      return [dict, offset + 1];
    }

    if (char === "l") {
      const list = [];
      offset++;
      while (data[offset] !== 101) {
        const [value, newOffset] = TorrentUtils.decodeBencode(data, offset);
        list.push(value);
        offset = newOffset;
      }
      return [list, offset + 1];
    }

    if (char === "i") {
      offset++;
      let num = "";
      while (data[offset] !== 101) {
        num += String.fromCharCode(data[offset]);
        offset++;
      }
      return [parseInt(num), offset + 1];
    }

    if (char >= "0" && char <= "9") {
      let lengthStr = "";
      while (data[offset] !== 58) {
        lengthStr += String.fromCharCode(data[offset]);
        offset++;
      }
      const length = parseInt(lengthStr);
      offset++;

      const str = new TextDecoder("utf-8", { fatal: false }).decode(
        data.slice(offset, offset + length),
      );
      return [str, offset + length];
    }

    throw new Error("Invalid bencode data");
  }
}
