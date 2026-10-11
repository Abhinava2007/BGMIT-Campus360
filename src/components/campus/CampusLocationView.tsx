import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { InstitutionConfig, Notice, CollegeEvent } from '../../types/index.js';
import {
  MapPin,
  Navigation,
  Globe,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  Award,
  UploadCloud,
  ImageIcon,
  Trophy,
  Vote,
  AlertCircle,
  Bus,
  BookOpen,
  Wifi,
  Sparkles,
  ArrowRight,
  Clock,
  Home,
  Briefcase,
} from 'lucide-react';

export const CampusLocationView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { currentUser, addToast } = useAuth();
  const [institution, setInstitution] = useState<InstitutionConfig | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Asset customization modal (Super Admin only)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [updatingAssets, setUpdatingAssets] = useState(false);

  const isSuperAdmin = currentUser.role === 'super_admin';

  useEffect(() => {
    loadCampusData();
  }, []);

  const loadCampusData = async () => {
    setLoading(true);
    try {
      const [instRes, notifRes, evRes] = await Promise.all([
        api.getInstitution(),
        api.getNotices(),
        api.getEvents(),
      ]);
      setInstitution(instRes.institution);
      setNotices(notifRes.notices || []);
      setEvents(evRes.events || []);

      if (instRes.institution.campusImageUrl) setCustomPhotoUrl(instRes.institution.campusImageUrl);
      if (instRes.institution.logoUrl) setCustomLogoUrl(instRes.institution.logoUrl);
    } catch (err: any) {
      addToast('error', 'Error loading campus details', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssets = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingAssets(true);
    try {
      const res = await api.updateInstitution({
        campusImageUrl: customPhotoUrl,
        logoUrl: customLogoUrl,
      });
      setInstitution(res.institution);
      addToast('success', 'Campus Media Updated', 'Updated verified campus imagery and institution badge.');
      setShowUploadModal(false);
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    } finally {
      setUpdatingAssets(false);
    }
  };

  if (loading || !institution) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading verified campus location details...</p>
      </div>
    );
  }

  // Exact Google Maps Embed URL for BGMIT Mudhol coordinates: 16.3382367, 75.2877228
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${institution.coordinates?.lat || 16.3382367},${
    institution.coordinates?.lng || 75.2877228
  }&hl=en&z=16&output=embed`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Verified Institutional Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950 text-white">
        {/* Campus Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity"
          style={{
            backgroundImage: `url(${
              institution.campusImageUrl ||
              'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80'
            })`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-blue-950/80" />

        <div className="relative z-10 p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-start gap-5 max-w-3xl">
            {/* Authentic BGMIT Emblem Logo */}
            <div className="p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-400/50 shadow-xl shrink-0">
              <img
                src={institution.logoUrl || '/bgmit-logo.svg'}
                alt="BGMIT Mudhol Official Seal"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl bg-slate-900 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/bgmit-logo.svg';
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-400/30">
                  Estd. 1906 • B.V.V. Sangha, Bagalkot
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Location &amp; Campus</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-400/30">
                  VTU College Code: 2BG
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                  {institution.name}
                </h1>
                <p className="text-sm sm:text-base font-semibold text-blue-200 mt-1">
                  {institution.affiliation}
                </p>
                <p className="text-xs text-slate-300">
                  {institution.approval}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 flex items-center gap-2 pt-1 font-medium">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{institution.address}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto">
            <a
              href={institution.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Directions on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={institution.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Official BGMIT Portal (bgmitm.ac.in)</span>
            </a>

            {isSuperAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-slate-200 font-medium text-xs border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Upload Custom Campus Photo / Logo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Professional Welcome Section for Students & Faculty */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-xs font-bold uppercase tracking-wider border border-blue-400/20">
              Welcome to BGMIT Community
            </span>
            <span className="text-xs text-slate-300 font-medium">AY {institution.academicYear}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Institutional Governance &amp; Student Responsibility Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Welcome to the centralized digital campus for Biluru Gurubasav Mahaswamiji Institute of Technology.
            Every responsibility has an owner, every task has a deadline, every election has secret ballots, and every student grievance is resolved under clear SLA rules.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 transition cursor-pointer"
          >
            Go to My Dashboard
          </button>
          <button
            onClick={() => onNavigate('tasks')}
            className="px-4 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-xs border border-blue-400/30 transition cursor-pointer"
          >
            Student Responsibilities
          </button>
        </div>
      </div>

      {/* 3. Main Location & Campus Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Google Map + Directions + Campus Features */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Google Map Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-600" />
                  <span>Campus Geographical Location (Google Maps)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Coordinates: <strong>16.3382367° N, 75.2877228° E</strong> • Mantur Road, Mudhol, Bagalkot Dist.
                </p>
              </div>

              <a
                href={institution.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps App</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Embedded Responsive Map */}
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner relative">
              <iframe
                title="BGMIT Mudhol Google Map Location"
                src={mapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>

            {/* Detailed Directions & Transit Assistance */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2.5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Transit Guide &amp; How to Reach BGMIT Mudhol:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <Bus className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">By Road / KSRTC Bus:</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Situated along Mantur Road, 2.5 km from Mudhol Central Bus Stand. Direct buses connect to Belagavi, Bagalkot, Vijayapura, and Hubballi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Nearest Railway Stations:</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Bagalkot Junction (BGK) is 45 km away; Ghataprabha Railway Station (GPB) is 48 km away with South Western Railway links.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <Globe className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Nearest Airports:</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Belagavi Sambra Airport (IXG) approx. 110 km via NH 52; Hubballi Airport (HBX) approx. 140 km.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Student Privacy Protected:</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      No student personal geolocations or private GPS data are ever collected or tracked by this governance system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Engineering Departments Directory */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <span>Academic Engineering &amp; Management Departments</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Approved undergraduate (B.E.) and postgraduate (MBA) programs under VTU Belagavi.
                </p>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                View Activity Matrix &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {institution.departments.map((dept, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition bg-slate-50/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Department #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      VTU Approved
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">{dept}</h4>
                  <p className="text-[11px] text-slate-500">
                    {dept.includes('MBA') ? '2-Year Full-Time Master Program' : '4-Year B.E. Degree • 8 Semesters • AICTE Curriculum'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sports & Campus Life Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>Sports, Physical Education &amp; Student Events</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Promoting athletic excellence, team spirit, and campus vibrancy at BGMIT.
                </p>
              </div>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                View All Events &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Annual Sports Meet</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Inter-departmental track, cricket tournament, kabaddi championships, and volleyball cups.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Techno-Spark Fest</span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-snug">
                  National technical symposium with paper presentations, coding sprints, and robotics expo.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Cultural Sambhrama</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  Kannada Rajyotsava celebrations, youth festivals, music, drama, and fine arts exhibitions.
                </p>
              </div>
            </div>
          </div>

          {/* Campus Infrastructure & Facilities */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Verified Campus Facilities &amp; Student Infrastructure</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Central Library &amp; Digital Knowledge Hub</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Thousands of engineering volumes, IEEE &amp; VTU e-consortium access, book bank scheme, and quiet study halls.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>Separate Hostels (Boys &amp; Girls)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Furnished on-campus hostel blocks with hygienic mess, 24/7 security, warden supervision, and Wi-Fi connectivity.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Bus className="w-4 h-4 text-orange-600" />
                  <span>College Bus Fleet</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Dedicated transportation connecting Mudhol city, Jamkhandi, Lokapur, Mahalingpur, and nearby rural areas.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <span>Training &amp; Placement Cell</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Soft skills development, aptitude workshops, industry MOUs, and campus recruitment drives.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Verified Directory & Contact Information */}
        <div className="space-y-6">
          {/* Institutional Contact Dossier Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Verified Campus Contacts</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Postal Address</span>
                <p className="font-semibold text-slate-800 leading-relaxed">
                  {institution.name}
                  <br />
                  {institution.address}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Principal Office</span>
                <p className="font-bold text-slate-900 text-sm">{institution.principalName}</p>
                <p className="text-slate-600 flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{institution.principalPhone}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Campus Landline</span>
                <p className="font-mono text-slate-800 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{institution.phone}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Official Email</span>
                <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${institution.email}`} className="text-blue-600 hover:underline">
                    {institution.email}
                  </a>
                </p>
                {institution.admissionEmail && (
                  <p className="text-slate-600 text-[11px] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Admissions: {institution.admissionEmail}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Hostel &amp; Student Help</span>
                <p className="text-slate-700 text-[11px]">Boys Hostel Warden: +91-8971066719</p>
                <p className="text-slate-700 text-[11px]">Girls Hostel Warden: +91-9742099202</p>
                <p className="text-slate-700 text-[11px]">Placement Officer: +91-9964571144</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Official Website</span>
                <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href={institution.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{institution.website}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <a
                href={institution.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate on Google Maps</span>
              </a>
            </div>
          </div>

          {/* Governance Quick Action Links */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-200/80 p-6 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Student Governance Modules</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct access to role-based responsibility delegation and institutional portals:
            </p>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onNavigate('tasks')}
                className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-100/50 text-slate-700 text-xs font-semibold border border-blue-100 transition flex items-center justify-between cursor-pointer"
              >
                <span>Student Responsibilities &amp; Tasks</span>
                <span className="text-blue-600 font-bold">&rarr;</span>
              </button>
              <button
                onClick={() => onNavigate('elections')}
                className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-100/50 text-slate-700 text-xs font-semibold border border-blue-100 transition flex items-center justify-between cursor-pointer"
              >
                <span>Council Elections &amp; Secret Voting</span>
                <span className="text-blue-600 font-bold">&rarr;</span>
              </button>
              <button
                onClick={() => onNavigate('complaints')}
                className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-100/50 text-slate-700 text-xs font-semibold border border-blue-100 transition flex items-center justify-between cursor-pointer"
              >
                <span>Student Grievance Redressal (6h SLA)</span>
                <span className="text-blue-600 font-bold">&rarr;</span>
              </button>
              <button
                onClick={() => onNavigate('notices')}
                className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-100/50 text-slate-700 text-xs font-semibold border border-blue-100 transition flex items-center justify-between cursor-pointer"
              >
                <span>Official Circulars &amp; Notices</span>
                <span className="text-blue-600 font-bold">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Customization Upload Modal (Super Admin only) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Custom College Imagery &amp; Logo</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateAssets} className="mt-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campus Photograph URL</label>
                <input
                  type="text"
                  value={customPhotoUrl}
                  onChange={(e) => setCustomPhotoUrl(e.target.value)}
                  placeholder="https://... image link"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Displays in the campus hero section and institutional headers.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Logo URL or Vector</label>
                <input
                  type="text"
                  value={customLogoUrl}
                  onChange={(e) => setCustomLogoUrl(e.target.value)}
                  placeholder="/bgmit-logo.svg or https://..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingAssets}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {updatingAssets ? 'Saving...' : 'Save Media Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
