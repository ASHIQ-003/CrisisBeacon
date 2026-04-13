import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiMail, FiMapPin, FiCheck } from 'react-icons/fi';
import { registerVolunteer } from '../services/api';
import toast from 'react-hot-toast';

const SKILL_OPTIONS = [
  'Food Distribution', 'Cooking', 'Medical', 'First Aid', 'Nursing',
  'Tutoring', 'Teaching', 'Education', 'Logistics', 'Transport',
  'Driving', 'IT Support', 'Technology', 'Counseling', 'Social Work',
  'Mental Health', 'Construction', 'Repair', 'Plumbing', 'General Helper',
];

export default function VolunteerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    skills: [],
    latitude: '', longitude: '',
    availability: 'available',
    language: 'en',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [detecting, setDetecting] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleSkill(skill) {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  }

  function detectLocation() {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(4),
          longitude: pos.coords.longitude.toFixed(4),
        }));
        setDetecting(false);
        toast.success('Location detected!');
      },
      () => { setDetecting(false); toast.error('Could not detect location'); },
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      return toast.error('Name and phone are required');
    }
    setSubmitting(true);
    try {
      await registerVolunteer({
        name: form.name,
        phone: form.phone,
        skills: form.skills.map(s => s.toLowerCase()),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        availability: form.availability,
        language: form.language,
      });
      setSuccess(true);
      toast.success('Registration successful!');
      setTimeout(() => navigate('/map'), 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="gradient-bg" style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }} className="animate-fade-in-up">
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-accent), #34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <FiCheck size={36} color="#0f1117" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Welcome aboard! 🎉</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            You're now registered as a VolunteerBridge volunteer.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
            Redirecting to the live map…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg" style={{ flex: 1, position: 'relative' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 620, margin: '0 auto', padding: '32px 24px' }}>
        <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Volunteer Registration
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Join VolunteerBridge and make a difference in your community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card animate-fade-in-up" style={{
          padding: 32, animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards',
        }}>
          {/* Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <FiUser size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="form-input" name="name" value={form.name} onChange={handleChange}
                  placeholder="John Doe" style={{ paddingLeft: 36 }} required />
              </div>
            </div>
            <div>
              <label className="form-label">Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <FiPhone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="form-input" name="phone" value={form.phone} onChange={handleChange}
                  placeholder="+919876543210" style={{ paddingLeft: 36 }} required />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Skills (select all that apply)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {SKILL_OPTIONS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  className={`skill-chip ${form.skills.includes(skill) ? 'active' : ''}`}
                  onClick={() => toggleSkill(skill)}
                >
                  {form.skills.includes(skill) && <FiCheck size={12} />} {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Location</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <input className="form-input" name="latitude" value={form.latitude} onChange={handleChange}
                placeholder="Latitude" type="number" step="any" />
              <input className="form-input" name="longitude" value={form.longitude} onChange={handleChange}
                placeholder="Longitude" type="number" step="any" />
              <button type="button" className="btn-secondary" onClick={detectLocation}
                disabled={detecting} style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiMapPin size={14} /> {detecting ? 'Detecting…' : 'Auto-detect'}
              </button>
            </div>
          </div>

          {/* Availability & Language */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label className="form-label">Availability</label>
              <select className="form-input" name="availability" value={form.availability} onChange={handleChange}>
                <option value="available">Available Now</option>
                <option value="scheduled">Scheduled</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div>
              <label className="form-label">Language</label>
              <select className="form-input" name="language" value={form.language} onChange={handleChange}>
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-accent" disabled={submitting}
            style={{ width: '100%', padding: '14px 0', fontSize: '1rem' }}>
            {submitting ? 'Registering…' : '🤝 Register as Volunteer'}
          </button>
        </form>
      </div>
    </div>
  );
}
