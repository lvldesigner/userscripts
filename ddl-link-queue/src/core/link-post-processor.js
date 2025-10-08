import { POST_PROCESS_CONFIGS } from "../config/post-process-configs.js";

export async function postProcessLink(link) {
  if (!link) return link;

  for (const config of POST_PROCESS_CONFIGS) {
    if (config.pattern.test(link)) {
      console.log(`[Post-Processor] Link matches pattern: ${config.name}`);
      try {
        const processedUrl = await config.process(link);
        if (processedUrl) {
          console.log(`[Post-Processor] Successfully processed: ${link} -> ${processedUrl}`);
          return processedUrl;
        } else {
          console.log(`[Post-Processor] Processing returned null, keeping original link`);
          return link;
        }
      } catch (error) {
        console.error(`[Post-Processor] Error processing link with ${config.name}:`, error);
        return link;
      }
    }
  }

  return link;
}
