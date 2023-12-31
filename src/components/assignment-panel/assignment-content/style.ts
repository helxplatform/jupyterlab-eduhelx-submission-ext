import { style } from 'typestyle'

export const containerClass = style({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column'
})

export const loadingContainerClass = style({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '36px 11px 4px 11px',
    color: 'var(--md-blue-600)'
})

export const assignmentContainerClass = style({
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
})