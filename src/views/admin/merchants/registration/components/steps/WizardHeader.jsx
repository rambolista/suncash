import { ProgressBar } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'
import clsx from 'clsx'
import Icon from '@/components/wrappers/Icon'
import { STEPS } from './wizardConstants'

// Mirrors iBIMSKP's NewBlotterWizard: progress bar + step nav.
export const WizardHeader = () => {
  const { activeStep, stepCount, goToStep } = useWizard()
  const progress = ((activeStep + 1) / stepCount) * 100

  return (
    <>
      <ProgressBar now={progress} className="mb-3" style={{ height: 6 }} />
      <ul className="nav nav-tabs wizard-tabs wizard-bordered flex-nowrap overflow-auto mb-0" data-wizard-nav role="tablist">
        {STEPS.map((item, index) => (
          <li className="nav-item flex-fill text-nowrap" key={item.key}>
            <button
              type="button"
              className={clsx('nav-link w-100 text-start', activeStep === index && 'active', activeStep > index && 'wizard-item-done')}
              onClick={() => { if (index <= activeStep) goToStep(index) }}
            >
              <span className="d-flex align-items-center">
                <span className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 34, height: 34, background: 'var(--theme-tertiary-bg)' }}>
                  {activeStep > index ? <Icon icon="check" className="fs-5" /> : <Icon icon={item.icon} className="fs-5" />}
                </span>
                <span className="flex-grow-1 ms-2 text-truncate">
                  <span className="mb-0 lh-base d-block fw-semibold text-body fs-sm">{item.label}</span>
                  <span className="fs-xxs text-muted">{item.hint}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
