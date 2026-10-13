from pathlib import Path

from build_demo_proposals import markdown_to_docx


ROOT = Path(__file__).resolve().parents[1]
PROPOSALS = ROOT / "docs" / "proposals"

SOURCES = [
    (
        PROPOSALS / "sources" / "OCEANPOWER_AI_PROGRAMME_PROPOSAL_CHINA_GLOBAL_EN.md",
        PROPOSALS / "final" / "Oceanpower_AI_Programme_Proposal_China_Global_EN.docx",
        "Oceanpower China and Global AI Programme Proposal",
        "Management proposal for a stage-gated first-year programme",
        "Prepared 28 September 2026",
        "en",
    ),
    (
        PROPOSALS / "sources" / "OCEANPOWER_AI_PROGRAMME_PROPOSAL_CHINA_GLOBAL_CN.md",
        PROPOSALS / "final" / "Oceanpower_AI_Programme_Proposal_China_Global_CN.docx",
        "Oceanpower 中国与全球 AI 项目建议书",
        "供管理层讨论的第一年度分阶段项目方案",
        "编制日期 2026 年 9 月 28 日",
        "zh",
    ),
]


if __name__ == "__main__":
    for source, output, title, subtitle, prepared, language in SOURCES:
        markdown_to_docx(source, output, title, subtitle, prepared, language)
        print(output)

