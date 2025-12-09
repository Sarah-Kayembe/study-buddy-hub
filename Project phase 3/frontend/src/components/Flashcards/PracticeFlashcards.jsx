import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { listFlashcardSets, getFlashcardSet, deleteFlashcardSet, updateFlashcardSet, updateFlashcard, deleteFlashcard } from "../../api/flashcards";

const PracticeFlashcards = forwardRef((props, ref) => {
  const [sets, setSets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingSetId, setEditingSetId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState("set"); // "set" or "cards"
  const [cardsData, setCardsData] = useState([]); // for editing cards
  const [editingCardId, setEditingCardId] = useState(null);
  const [editCardFront, setEditCardFront] = useState("");
  const [editCardBack, setEditCardBack] = useState("");
  const [deleteCardId, setDeleteCardId] = useState(null);

  const reloadSets = () => {
    setLoading(true);
    listFlashcardSets()
      .then(setSets)
      .catch((err) => {
        setError(typeof err === 'string' ? err : 'Failed to load sets');
        setSets([]);
      })
      .finally(() => setLoading(false));
  };

  // Expose reloadSets via forwardRef
  useImperativeHandle(ref, () => ({
    reloadSets
  }));

  useEffect(() => {
    reloadSets();
  }, []);

  const openSet = async (id) => {
    try {
      setError(null);
      const data = await getFlashcardSet(id);
      setSelected(data);
      setIndex(0);
      setFlipped(false);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load set');
    }
  };

  const handleEditClick = async (set) => {
    try {
      setEditingSetId(set.id);
      setEditTitle(set.title || "");
      setEditDescription(set.description || "");
      setEditMode("set");
      // Fetch the full set data with all cards
      const fullSet = await getFlashcardSet(set.id);
      setCardsData(fullSet.cards || []);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load set details');
      setCardsData([]);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      setError(null);
      await updateFlashcardSet(editingSetId, {
        title: editTitle,
        description: editDescription,
      });
      setEditingSetId(null);
      setEditMode("set");
      reloadSets();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCard = (card) => {
    setEditingCardId(card.flashcard_id);
    setEditCardFront(card.front_text || card.front || "");
    setEditCardBack(card.back_text || card.back || "");
  };

  const handleSaveCard = async () => {
    try {
      setSaving(true);
      setError(null);
      await updateFlashcard(editingCardId, {
        front_text: editCardFront,
        back_text: editCardBack,
      });
      // Update cardsData locally
      setCardsData(cardsData.map(c => 
        c.flashcard_id === editingCardId 
          ? { ...c, front_text: editCardFront, back_text: editCardBack }
          : c
      ));
      setEditingCardId(null);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save card');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      setSaving(true);
      setError(null);
      await deleteFlashcard(cardId);
      setCardsData(cardsData.filter(c => c.flashcard_id !== cardId));
      setDeleteCardId(null);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to delete card');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async (setId) => {
    try {
      setSaving(true);
      setError(null);
      await deleteFlashcardSet(setId);
      setShowDeleteConfirm(null);
      reloadSets();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to delete set');
    } finally {
      setSaving(false);
    }
  };

  if (!selected) {
    return (
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Practice Flashcards</h3>
        {loading && <div style={{ color: '#9ca3af' }}>Loading sets...</div>}
        {error && <div style={{ color: '#f97373', marginBottom: '1rem' }}>{error}</div>}
        {!loading && sets.length === 0 && <div style={{ color: '#9ca3af' }}>No sets found. Create one to get started!</div>}
        
        {/* Edit Modal */}
        {editingSetId && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(148,163,184,0.3)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '95%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Edit Flashcard Set</h4>
              
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(148,163,184,0.3)' }}>
                <button
                  onClick={() => setEditMode("set")}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: editMode === "set" ? 'rgba(14,165,233,0.2)' : 'transparent',
                    color: editMode === "set" ? '#0ea5e9' : '#9ca3af',
                    cursor: 'pointer',
                    borderBottom: editMode === "set" ? '2px solid #0ea5e9' : 'none',
                  }}
                >
                  Set Details
                </button>
                <button
                  onClick={() => setEditMode("cards")}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: editMode === "cards" ? 'rgba(14,165,233,0.2)' : 'transparent',
                    color: editMode === "cards" ? '#0ea5e9' : '#9ca3af',
                    cursor: 'pointer',
                    borderBottom: editMode === "cards" ? '2px solid #0ea5e9' : 'none',
                  }}
                >
                  Edit Cards ({cardsData.length})
                </button>
              </div>

              {/* Set Details Tab */}
              {editMode === "set" && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(148,163,184,0.3)',
                        background: 'rgba(30,41,59,0.5)',
                        color: '#e5e7eb',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(148,163,184,0.3)',
                        background: 'rgba(30,41,59,0.5)',
                        color: '#e5e7eb',
                        boxSizing: 'border-box',
                        minHeight: '80px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </>
              )}

              {/* Edit Cards Tab */}
              {editMode === "cards" && (
                <>
                  {editingCardId ? (
                    <>
                      <h5 style={{ marginTop: 0, color: '#93c5fd' }}>Edit Card</h5>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Front (Question)</label>
                        <textarea
                          value={editCardFront}
                          onChange={(e) => setEditCardFront(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(148,163,184,0.3)',
                            background: 'rgba(30,41,59,0.5)',
                            color: '#e5e7eb',
                            boxSizing: 'border-box',
                            minHeight: '60px',
                            fontFamily: 'inherit',
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Back (Answer)</label>
                        <textarea
                          value={editCardBack}
                          onChange={(e) => setEditCardBack(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(148,163,184,0.3)',
                            background: 'rgba(30,41,59,0.5)',
                            color: '#e5e7eb',
                            boxSizing: 'border-box',
                            minHeight: '60px',
                            fontFamily: 'inherit',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button
                          onClick={() => setEditingCardId(null)}
                          disabled={saving}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(148,163,184,0.3)',
                            background: 'rgba(128,128,128,0.2)',
                            color: '#e5e7eb',
                            cursor: saving ? 'default' : 'pointer',
                            opacity: saving ? 0.5 : 1,
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCard}
                          disabled={saving}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(34,197,94,0.5)',
                            background: 'rgba(34,197,94,0.2)',
                            color: '#e5e7eb',
                            cursor: saving ? 'default' : 'pointer',
                            opacity: saving ? 0.5 : 1,
                          }}
                        >
                          {saving ? 'Saving...' : 'Save Card'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {cardsData.length === 0 ? (
                          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>No cards yet</div>
                        ) : (
                          cardsData.map((card, idx) => (
                            <div
                              key={card.flashcard_id}
                              style={{
                                padding: '1rem',
                                marginBottom: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(148,163,184,0.3)',
                                background: 'rgba(30,41,59,0.3)',
                              }}
                            >
                              <div style={{ marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Front:</div>
                                <div style={{ color: '#e5e7eb', fontSize: '0.9rem' }}>{card.front_text || card.front}</div>
                              </div>
                              <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Back:</div>
                                <div style={{ color: '#e5e7eb', fontSize: '0.9rem' }}>{card.back_text || card.back}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleEditCard(card)}
                                  style={{
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: '0.3rem',
                                    border: 'none',
                                    background: 'rgba(59,130,246,0.2)',
                                    color: '#93c5fd',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteCardId(card.flashcard_id)}
                                  style={{
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: '0.3rem',
                                    border: 'none',
                                    background: 'rgba(239,68,68,0.2)',
                                    color: '#fca5a5',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Delete Card Confirmation */}
              {deleteCardId && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1001,
                }}>
                  <div style={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(239,68,68,0.5)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    maxWidth: '300px',
                    width: '90%',
                  }}>
                    <h5 style={{ marginTop: 0, color: '#f87171' }}>Delete Card?</h5>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                      This cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setDeleteCardId(null)}
                        disabled={saving}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.4rem',
                          border: '1px solid rgba(148,163,184,0.3)',
                          background: 'rgba(128,128,128,0.2)',
                          color: '#e5e7eb',
                          cursor: saving ? 'default' : 'pointer',
                          opacity: saving ? 0.5 : 1,
                          fontSize: '0.8rem',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteCard(deleteCardId)}
                        disabled={saving}
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '0.4rem',
                          border: '1px solid rgba(239,68,68,0.5)',
                          background: 'rgba(239,68,68,0.2)',
                          color: '#e5e7eb',
                          cursor: saving ? 'default' : 'pointer',
                          opacity: saving ? 0.5 : 1,
                          fontSize: '0.8rem',
                        }}
                      >
                        {saving ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(148,163,184,0.3)' }}>
                <button
                  onClick={() => setEditingSetId(null)}
                  disabled={saving}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(148,163,184,0.3)',
                    background: 'rgba(128,128,128,0.2)',
                    color: '#e5e7eb',
                    cursor: saving ? 'default' : 'pointer',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  Close
                </button>
                {editMode === "set" && (
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(34,197,94,0.5)',
                      background: 'rgba(34,197,94,0.2)',
                      color: '#e5e7eb',
                      cursor: saving ? 'default' : 'pointer',
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '90%',
            }}>
              <h4 style={{ marginTop: 0, color: '#f87171' }}>Delete Flashcard Set?</h4>
              <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>
                This action cannot be undone. All flashcards in this set will be permanently deleted.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={saving}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(148,163,184,0.3)',
                    background: 'rgba(128,128,128,0.2)',
                    color: '#e5e7eb',
                    cursor: saving ? 'default' : 'pointer',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteClick(showDeleteConfirm)}
                  disabled={saving}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(239,68,68,0.5)',
                    background: 'rgba(239,68,68,0.2)',
                    color: '#e5e7eb',
                    cursor: saving ? 'default' : 'pointer',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          {sets.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(148,163,184,0.3)',
                background: 'rgba(14,165,233,0.1)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(14,165,233,0.2)';
                e.currentTarget.style.borderColor = 'rgba(14,165,233,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(14,165,233,0.1)';
                e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
              }}
            >
              <button
                onClick={() => openSet(s.id)}
                style={{
                  flex: 1,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: '#e5e7eb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.95rem',
                }}
              >
                <strong>{s.title || `Set ${s.id}`}</strong>
                {s.description && <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>{s.description}</div>}
              </button>
              <button
                onClick={() => handleEditClick(s)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  background: 'rgba(59,130,246,0.2)',
                  color: '#93c5fd',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                }}
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(s.id)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '0.4rem',
                  border: 'none',
                  background: 'rgba(239,68,68,0.2)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = selected.cards || [];
  const card = cards[index];
  const total = cards.length;

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>
          {selected.title}
        </h3>
        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          Card {index + 1} of {total}
        </div>
      </div>

      {card ? (
        <div>
          <div
            className={`flashcard-card ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped((f) => !f)}
            style={{ marginBottom: '1.5rem', margin: '0 auto 1.5rem auto' }}
          >
            <div className="flashcard-front">{card.front_text || card.front || 'No front'}</div>
            <div className="flashcard-back">{card.back_text || card.back || 'No back'}</div>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem', textAlign: 'center' }}>
            Click card to flip • {flipped ? 'Showing Answer' : 'Showing Question'}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (index > 0) {
                  setIndex(index - 1);
                  setFlipped(false);
                }
              }}
              disabled={index === 0}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(148,163,184,0.3)',
                background: index === 0 ? 'rgba(128,128,128,0.2)' : 'rgba(14,165,233,0.15)',
                color: index === 0 ? '#808080' : '#e5e7eb',
                cursor: index === 0 ? 'default' : 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Prev
            </button>

            <button
              onClick={() => {
                if (index < total - 1) {
                  setIndex(index + 1);
                  setFlipped(false);
                }
              }}
              disabled={index === total - 1}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(148,163,184,0.3)',
                background: index === total - 1 ? 'rgba(128,128,128,0.2)' : 'rgba(14,165,233,0.15)',
                color: index === total - 1 ? '#808080' : '#e5e7eb',
                cursor: index === total - 1 ? 'default' : 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Next
            </button>

            <button
              onClick={() => {
                setSelected(null);
                setFlipped(false);
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(148,163,184,0.3)',
                background: 'rgba(239,68,68,0.15)',
                color: '#e5e7eb',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div style={{ color: '#9ca3af' }}>No cards in this set.</div>
      )}
    </div>
  );
});

PracticeFlashcards.displayName = "PracticeFlashcards";
export default PracticeFlashcards;
