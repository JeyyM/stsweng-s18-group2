import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// NOTE: imageCenter is an html tag
export default function SimpleModal({ isOpen, onClose, title, imageCenter,
  bodyText, confirm = false, onConfirm, onCancel }) {
  // if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (<motion.div
        className="fixed inset-0 flex items-center justify-center z-99"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}>

        <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-lg max-w-[80rem] w-full min-h-[30rem] z-10 overflow-hidden flex flex-col">
          <div className='w-full p-5 drop-shadow-base' style={{ backgroundColor: "var(--accent-white)" }}>
            <h2 className="header-sub">{title}</h2>
          </div>

          <div className='flex flex-col justify-between flex-1 p-10 text-center'>

            {imageCenter && imageCenter}

            <p className="font-label my-15">{bodyText}</p>

            <div className="flex justify-center gap-10 mt-10">
              {confirm ? (
                <>
                  <button className="btn-outline font-bold-label drop-shadow-base"
                    onClick={() => {
                      onCancel?.();
                      onClose();
                    }}>
                    Cancel
                  </button>
                  <button
                    className="btn-primary font-bold-label drop-shadow-base"
                    onClick={() => {
                      onConfirm?.();
                    }}>
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  className="btn-outline"
                  onClick={onClose}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>

      </motion.div>)}

    </AnimatePresence>
  );
}
