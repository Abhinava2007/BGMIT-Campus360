import React from 'react';
import {
  MapPin,
  Navigation,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  ExternalLink,
  GraduationCap,
  Building,
} from 'lucide-react';

interface CampusFooterProps {
  onNavigate?: (tab: string) => void;
}

export const CampusFooter: React.FC<CampusFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/80 backdrop-blur-xs text-slate-600 text-xs">
      {/* Top Banner with Quick Location Highlights */}
      <div className="bg-slate-900 text-white px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <img
              src="/bgmit-logo.svg"
              alt="BGMIT Mudhol Emblem"
              className="w-10 h-10 object-contain shrink-0 rounded-full border border-amber-400/50 bg-white/10 p-0.5"
            />
            <div>
              <p className="font-bold text-sm text-slate-100 flex items-center justify-center md:justify-start gap-2">
                <span>Biluru Gurubasav Mahaswamiji Institute of Technology (BGMIT)</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  Verified Campus
                </span>
              </p>
              <p className="text-[11px] text-slate-300 flex items-center justify-center md:justify-start gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Mantur Road, Mudhol - 587313, Bagalkot Dist, Karnataka, India</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center">
            <a
              href="https://maps.app.goo.gl/tuFvXRTYUCLtEhBz8"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            {onNavigate && (
              <button
                onClick={() => onNavigate('campus')}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>View Campus Map</span>
              </button>
            )}

            <a
              href="http://www.bgmitm.ac.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-medium text-xs border border-white/15 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-sky-300" />
              <span>Official Website</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Directory Columns */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Institutional Heritage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Management & Heritage
              </h4>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Managed by <strong>B.V.V. Sangha (Basaveshwar Veerashaiva Vidyavardhaka Sangha, Bagalkot)</strong>, founded in 1906. Committed to engineering excellence and value-based education.
            </p>
            <div className="pt-1 text-[11px] space-y-1 text-slate-500">
              <p>• Affiliated to VTU Belagavi</p>
              <p>• Approved by AICTE, New Delhi</p>
              <p>• Recognized by Govt. of Karnataka</p>
            </div>
          </div>

          {/* Col 2: Academic Engineering Wings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Academic Departments
              </h4>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600">
              <li>• Computer Science &amp; Engineering</li>
              <li>• Artificial Intelligence &amp; Machine Learning</li>
              <li>• Electronics &amp; Communication Engineering</li>
              <li>• Civil Engineering</li>
              <li>• Mechanical Engineering</li>
              <li>• Master of Business Administration (MBA)</li>
            </ul>
          </div>

          {/* Col 3: Verified Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Campus Contacts
              </h4>
            </div>
            <div className="space-y-2 text-[11px] text-slate-600">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Landline: <strong>08350-454452 / 280404</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Principal Office: <strong>+91-9141201838</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Admin: <a href="mailto:bvvsbgmitm@gmail.com" className="text-blue-600 hover:underline">bvvsbgmitm@gmail.com</a></span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Admissions: <a href="mailto:bgmitadmission@gmail.com" className="text-blue-600 hover:underline">bgmitadmission@gmail.com</a></span>
              </p>
            </div>
          </div>

          {/* Col 4: Location & Governance Privacy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Governance & Privacy
              </h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every responsibility has an owner, every task has a deadline, every election has secret ballots, and every workflow is auditable.
            </p>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Student Privacy Guarantee</span>
              </div>
              <p>Personal geolocation is strictly protected. Only official college campus premises are mapped.</p>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Biluru Gurubasav Mahaswamiji Institute of Technology (BGMIT), Mudhol. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://maps.app.goo.gl/tuFvXRTYUCLtEhBz8"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Google Maps Pin (16.3382°N, 75.2877°E)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a href="http://www.bgmitm.ac.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600">
              bgmitm.ac.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
