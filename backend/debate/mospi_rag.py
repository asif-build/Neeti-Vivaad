import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

# Curated reference document set (MoSPI publications, NSC Guidelines, Data Quality Framework)
MOSPI_DOCUMENTS = [
    {
        "doc_code": "MOSPI-IDQF-2024",
        "title": "India Data Quality Framework (IDQF) 2024 Standards",
        "publisher": "Ministry of Statistics and Programme Implementation",
        "content": "Section 4.2 Data Integrity & Validation: All national sample statistical collections must maintain a minimum confidence interval of 95%. Automated anomaly detection must flag duplicate household records within 24 hours of submission. Non-sampling errors must be minimized via real-time GPS verification at enumerator check-in."
    },
    {
        "doc_code": "NSC-REC-2023-08",
        "title": "National Statistical Commission Recommendation on Direct Benefit Transfer Surveys",
        "publisher": "National Statistical Commission (NSC)",
        "content": "Recommendation 3.1: Transitioning from traditional 5-year sample surveys to quarterly digital surveys is essential for high-frequency economic policy. However, continuous sampling must preserve sample representativeness in rural blocks and avoid survey fatigue among field respondents."
    },
    {
        "doc_code": "NDSAP-PRIVACY-2023",
        "title": "National Data Sharing and Accessibility Policy (NDSAP) Privacy Rules",
        "publisher": "MeitY & MoSPI Digital Committee",
        "content": "Clause 12: Microdata dissemination must undergo k-anonymity (k>=5) and differential privacy noise addition before public release. Personally Identifiable Information (PII) including Aadhaar numbers and biometric tokens must be stripped at the field collection tablet level."
    },
    {
        "doc_code": "NSO-FOD-SOP-2024",
        "title": "NSO Field Operations Division Standard Operating Procedure for Enumerators",
        "publisher": "NSO Field Operations Division",
        "content": "Chapter 2. Field Feasibility: Enumerators operating in LWE (Left-Wing Extremism) affected or hilly terrains must be provided offline-first mobile survey tools. Multi-tier verification shouldn't exceed 15 minutes per household to maintain public cooperation and response rates."
    },
    {
        "doc_code": "MOSPI-POLICY-2025",
        "title": "MoSPI Policy Guidelines on AI & Automation in Official Statistics",
        "publisher": "Ministry of Statistics and Programme Implementation",
        "content": "Section 7: AI agents and algorithmic models utilized for policy synthesis must remain strictly deterministic, auditable, and grounded in published statistical standards. Hallucinated or synthetic statistical claims are expressly prohibited in official decision notes."
    }
]

def mock_vectorize(text_list, dim=128):
    vectors = []
    for text in text_list:
        v = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        for idx, w in enumerate(words):
            hash_val = hash(w) % dim
            v[hash_val] += 1.0
        norm = np.linalg.norm(v)
        if norm > 0:
            v /= norm
        vectors.append(v)
    return np.array(vectors, dtype=np.float32)

class MoSPIRAGStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MoSPIRAGStore, cls).__new__(cls)
            cls._instance._init_store()
        return cls._instance

    def _init_store(self):
        self.docs = MOSPI_DOCUMENTS
        texts = [f"{d['title']} {d['publisher']} {d['content']}" for d in self.docs]
        self.embeddings = mock_vectorize(texts, dim=128)
        self.dim = 128
        
        if FAISS_AVAILABLE:
            self.index = faiss.IndexFlatIP(self.dim)
            faiss.normalize_L2(self.embeddings)
            self.index.add(self.embeddings)
        else:
            self.index = None

    def retrieve(self, query_text, top_k=2):
        q_vec = mock_vectorize([query_text], dim=self.dim)[0]
        results = []
        
        if FAISS_AVAILABLE and self.index is not None:
            qv = q_vec.reshape(1, -1)
            faiss.normalize_L2(qv)
            scores, indices = self.index.search(qv, min(top_k, len(self.docs)))
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.docs):
                    results.append(self.docs[idx])
        else:
            q_norm = q_vec / (np.linalg.norm(q_vec) + 1e-9)
            sims = np.dot(self.embeddings, q_norm)
            top_indices = np.argsort(sims)[::-1][:top_k]
            for idx in top_indices:
                results.append(self.docs[idx])
                
        return results
