import { useState } from 'react';
import type { ModificationRule, HeaderModification, MatchType } from '../../types';

interface RuleEditorProps {
  rule?: ModificationRule;
  onSave: (rule: ModificationRule) => void;
  onCancel: () => void;
}

export function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const [formData, setFormData] = useState<ModificationRule>(() => {
    if (rule) return rule;

    return {
      id: crypto.randomUUID(),
      enabled: true,
      name: '',
      tabUrl: '',
      tabUrlMatchType: 'startsWith' as MatchType,
      targetDomain: '',
      targetDomainMatchType: 'startsWith' as MatchType,
      headers: [],
    };
  });

  const addHeader = () => {
    const newHeader: HeaderModification = {
      id: crypto.randomUUID(),
      name: '',
      value: '',
      action: 'set',
    };
    setFormData({
      ...formData,
      headers: [...formData.headers, newHeader],
    });
  };

  const updateHeader = (id: string, field: keyof HeaderModification, value: string) => {
    setFormData({
      ...formData,
      headers: formData.headers.map(h =>
        h.id === id ? { ...h, [field]: value } : h
      ),
    });
  };

  const removeHeader = (id: string) => {
    setFormData({
      ...formData,
      headers: formData.headers.filter(h => h.id !== id),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetDomain) {
      alert('Пожалуйста, заполните название и целевой домен');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{rule ? 'Редактировать правило' : 'Новое правило'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название правила *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: API Headers"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>URL сайта (таб) - необязательно</label>
              <input
                type="text"
                value={formData.tabUrl || ''}
                onChange={(e) => setFormData({ ...formData, tabUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="form-group">
              <label>Тип совпадения</label>
              <select
                value={formData.tabUrlMatchType}
                onChange={(e) => setFormData({ ...formData, tabUrlMatchType: e.target.value as MatchType })}
              >
                <option value="startsWith">Начинается с</option>
                <option value="endsWith">Заканчивается на</option>
                <option value="equals">Равно</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Целевой домен *</label>
              <input
                type="text"
                value={formData.targetDomain}
                onChange={(e) => setFormData({ ...formData, targetDomain: e.target.value })}
                placeholder="https://api.example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Тип совпадения</label>
              <select
                value={formData.targetDomainMatchType}
                onChange={(e) => setFormData({ ...formData, targetDomainMatchType: e.target.value as MatchType })}
              >
                <option value="startsWith">Начинается с</option>
                <option value="endsWith">Заканчивается на</option>
                <option value="equals">Равно</option>
              </select>
            </div>
          </div>

          <div className="headers-section">
            <h4>HTTP Заголовки</h4>
            {formData.headers.map((header) => (
              <div key={header.id} className="header-item">
                <input
                  type="text"
                  value={header.name}
                  onChange={(e) => updateHeader(header.id, 'name', e.target.value)}
                  placeholder="Имя заголовка"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                  placeholder="Значение"
                  disabled={header.action === 'remove'}
                />
                <select
                  value={header.action}
                  onChange={(e) => updateHeader(header.id, 'action', e.target.value)}
                >
                  <option value="set">Установить</option>
                  <option value="append">Добавить</option>
                  <option value="remove">Удалить</option>
                </select>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => removeHeader(header.id)}
                  title="Удалить заголовок"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addHeader}>
              + Добавить заголовок
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              {rule ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
