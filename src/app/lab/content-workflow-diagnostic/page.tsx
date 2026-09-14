import { pageMetadata } from "@/lib/metadata";
import DiagnosticTool from "./tool";
import styles from "./diagnostic.module.css";

export const metadata = pageMetadata("Content Workflow Diagnostic", "/lab/content-workflow-diagnostic/", "Find the biggest bottlenecks in your content workflow, AI use and quality control with a free 15-question diagnostic.");

export default function ContentWorkflowDiagnosticPage() {
  return <div className={`container ${styles.page}`}><DiagnosticTool /></div>;
}
