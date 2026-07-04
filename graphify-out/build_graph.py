import sys, json
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json
from pathlib import Path

extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))

# Build graph (undirected by default)
g = build_from_json(extraction, directed=False, root=Path('.'))

# Run clustering
communities = cluster(g)

# Score nodes
score_all(g, communities)

# Generate analytics metrics
gods = god_nodes(g, limit=10)
surprises = surprising_connections(g, communities, limit=5)
questions = suggest_questions(g, limit=5)

# Generate report markdown
report_md = generate(g, communities, gods, surprises, questions)
Path('GRAPH_REPORT.md').write_text(report_md, encoding='utf-8')

# Export graph data (Obsidian index / graph.json)
to_json(g, communities, Path('graphify-out'))
print("Graph construction and reports successfully generated!")
