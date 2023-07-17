import React, { Fragment, useMemo, useState } from 'react'
import {
    Avatar, List, ListItem, ListItemAvatar as _ListItemAvatar, ListItemText,
    ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails
} from '@material-ui/core'
import { GetAppSharp, QueryBuilderOutlined, ExpandMoreSharp } from '@material-ui/icons'
import { classes } from 'typestyle'
import { assignmentBucketContainerClass, assignmentListHeaderClass, downloadAssignmentButtonClass } from './style'
import { TextDivider } from '../../text-divider'
import { useAssignment } from '../../../contexts'
import type { IAssignment } from '../../../api'
import { DateFormat } from '../../../utils'
import { assignmentsListClass } from '../assignment-submissions/style'
import { disabledButtonClass } from '../../style'

const ListItemAvatar = _ListItemAvatar as any

interface ListHeaderProps {
    title: string
}

interface AssignmentListItemProps {
    assignment: IAssignment
}

interface AssignmentsBucketProps {
    title: string
    assignments?: IAssignment[]
    emptyText?: string
    defaultExpanded?: boolean
}

const ListHeader = ({ title }: ListHeaderProps) => {
    return (
        <span className={ assignmentListHeaderClass }>
            { title }
        </span>
    )
}

const AssignmentListItem = ({ assignment }: AssignmentListItemProps) => {
    return (
        <ListItem
            key={ assignment.id }
            dense
            style={{
                padding: '4px 8px'
            }}
        >
            <ListItemText disableTypography>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    { assignment.name }
                </div>
                <div style={{ fontSize: 13, color: 'var(--jp-ui-font-color2' }}>
                    {
                        assignment.isClosed ? (
                            <span title={ new DateFormat(assignment.adjustedDueDate).toBasicDatetime() }>
                                Closed
                            </span>
                        ) : assignment.isReleased ? (
                            <span title={ new DateFormat(assignment.adjustedDueDate).toBasicDatetime() }>
                                Closes in { new DateFormat(assignment.adjustedDueDate).toRelativeDatetime() }
                                { assignment.isExtended && (
                                    <i>&nbsp;(extended)</i>
                                ) }
                            </span>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div
                                    title={ new DateFormat(assignment.releasedDate).toBasicDatetime() }
                                >
                                    Opens in { new DateFormat(assignment.releasedDate).toRelativeDatetime() }
                                </div>
                                <div
                                    title={ new DateFormat(assignment.adjustedDueDate).toBasicDatetime() }
                                    style={{ marginTop: 4, fontSize: 12, display: 'flex', alignItems: 'center' }}
                                >
                                    <QueryBuilderOutlined style={{ fontSize: 16 }} />
                                    &nbsp;Lasts { new DateFormat(assignment.adjustedDueDate).toRelativeDatetime(assignment.releasedDate) }
                                </div>
                            </div>
                        )
                    }
                </div>
            </ListItemText>
            <ListItemAvatar style={{ minWidth: 0, marginLeft: 16 }}>
                <Avatar variant="square">
                    <button
                        className={ classes(downloadAssignmentButtonClass, disabledButtonClass) }
                    >
                        <GetAppSharp />
                    </button>
                </Avatar>
            </ListItemAvatar>
        </ListItem>
    )
}

const AssignmentsBucket = ({
    title,
    assignments,
    emptyText="There are currently no assignments to work on.",
    defaultExpanded=false,
}: AssignmentsBucketProps) => {
    const [expanded, setExpanded] = useState<boolean>(defaultExpanded)

    const assignmentsSource = useMemo(() => (
        assignments?.sort((a, b) => a.releasedDate.getTime() - b.releasedDate.getTime())
    ), [assignments])

    const isEmpty = useMemo(() => !assignmentsSource || assignmentsSource.length === 0, [assignmentsSource])

    return (
        <ExpansionPanel
            className={ assignmentBucketContainerClass }
            square
            expanded={ expanded }
            onChange={ () => setExpanded(!expanded) }
        >
            <ExpansionPanelSummary
                expandIcon={ <ExpandMoreSharp /> }
                style={{ paddingLeft: 11 }}
            >
                <ListHeader title={ title } />
            </ExpansionPanelSummary>
            <ExpansionPanelDetails
                style={{ display: 'flex', flexDirection: 'column', paddingTop: 0, paddingLeft: 11, paddingRight: 11 }}
            >
                { !isEmpty ? (
                    assignmentsSource?.map((assignment) => (
                        <AssignmentListItem key={ assignment.id } assignment={ assignment } />
                    ))
                ) : (
                    <span style={{ color: 'var(--jp-ui-font-color1)' }}>
                        { emptyText }
                    </span>
                ) }
            </ExpansionPanelDetails>
        </ExpansionPanel>
    )
}

export const AssignmentsList = () => {
    const { assignments } = useAssignment()!

    const upcomingAssignments = useMemo(() => assignments?.filter((assignment) => !assignment.isReleased), [assignments])
    const activeAssignments = useMemo(() => assignments?.filter((assignment) => assignment.isReleased && !assignment.isClosed), [assignments])
    const pastAssignments = useMemo(() => assignments?.filter((assignment) => assignment.isReleased && assignment.isClosed), [assignments])

    return (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: 'calc(100% + 22px)' }}>
            <div className={ assignmentsListClass }>
                <AssignmentsBucket
                    title={ `Active${ activeAssignments ? " (" + activeAssignments.length + ")" : "" }` }
                    assignments={ activeAssignments }
                    emptyText="There aren't any assignments available to work on at the moment."
                    defaultExpanded={ true }
                />
                <AssignmentsBucket
                    title={ `Upcoming${ upcomingAssignments ? " (" + upcomingAssignments.length + ")" : "" }` }
                    assignments={ upcomingAssignments }
                    emptyText="There aren't any upcoming assignments right now."
                    defaultExpanded={ true }
                />
                <AssignmentsBucket
                    title={ `Past${ pastAssignments ? " (" + pastAssignments.length + ")" : "" }` }
                    assignments={ pastAssignments }
                    emptyText="There aren't any past assignments."
                    defaultExpanded={ false }
                />
            </div>
        </div>
    )
}