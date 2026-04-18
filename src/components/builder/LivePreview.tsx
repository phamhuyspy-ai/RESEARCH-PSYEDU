import React from 'react';
import { useBuilderStore } from '../../stores/builderStore';

const LivePreview: React.FC = () => {
  const { activeSurvey } = useBuilderStore();

  if (!activeSurvey) return null;

  return (
    <div className="sticky top-24 h-[calc(100vh-120px)] bg-white border-[8px] border-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative z-20 mx-auto">
      <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 flex justify-center rounded-b-3xl w-40 mx-auto z-30" />
      
      <div 
        className="flex-1 overflow-y-auto bg-bg-main custom-scrollbar relative"
        style={{
          backgroundColor: activeSurvey.branding?.backgroundColor || '#F8FAFC',
          fontFamily: activeSurvey.branding?.fontFamily || 'Inter'
        }}
      >
        <div 
          className="h-32 bg-primary/10 relative"
          style={{ backgroundColor: activeSurvey.branding?.primaryColor ? `${activeSurvey.branding.primaryColor}20` : undefined }}
        >
          {activeSurvey.branding?.logoUrl && (
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 bg-white rounded-xl shadow-md p-2 flex items-center justify-center">
                <img src={activeSurvey.branding.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 pt-14 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-main space-y-4">
            <h1 className="text-xl font-bold text-text-main" style={{ color: activeSurvey.branding?.primaryColor || '#2E97A7' }}>
              {activeSurvey.name}
            </h1>
            <p className="text-sm text-text-muted whitespace-pre-wrap">{activeSurvey.description}</p>
          </div>

          <div className="opacity-70 pointer-events-none space-y-4 pb-12">
            {activeSurvey.blocks.map((block) => (
              <div key={block.id} className="bg-white p-5 rounded-2xl shadow-sm border border-border-main">
                {block.type === 'section' ? (
                  <div className="border-b border-border-main pb-4 mb-2">
                    <h2 className="text-lg font-bold text-text-main" style={{ color: activeSurvey.branding?.primaryColor || '#2E97A7' }}>
                      {block.title}
                    </h2>
                    {block.description && (
                      <p className="text-sm text-text-muted mt-2">{block.description}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-bold mb-1">
                      {block.title}
                      {block.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    {block.description && (
                      <p className="text-xs text-text-muted mb-4">{block.description}</p>
                    )}
                    
                    {block.type === 'text' && (
                      <div className="h-10 border border-border-main rounded-lg bg-bg-main" />
                    )}
                    {(block.type === 'single_choice' || block.type === 'likert') && (
                      <div className="space-y-2">
                        {block.options?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-border-main" />
                            <span className="text-xs">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {block.type === 'multi_choice' && (
                      <div className="space-y-2">
                        {block.options?.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border border-border-main" />
                            <span className="text-xs">{opt.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {block.type === 'matrix' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className="p-2 border-b border-border-main text-left"></th>
                              {block.matrixCols?.map(c => (
                                <th key={c.value} className="p-2 border-b border-border-main text-center font-medium text-text-muted">{c.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.matrixRows?.map(r => (
                              <tr key={r.code}>
                                <td className="p-2 border-b border-border-main font-medium">{r.label}</td>
                                {block.matrixCols?.map(c => (
                                  <td key={c.value} className="p-2 border-b border-border-main text-center">
                                    <div className="w-3 h-3 rounded-full border border-border-main mx-auto" />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
