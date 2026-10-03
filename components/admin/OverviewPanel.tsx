import type {ReactNode} from 'react';
export function OverviewPanel({title,description,icon,actions,children,className=''}:{title:string;description:string;icon:ReactNode;actions?:ReactNode;children:ReactNode;className?:string}) {
  return <section className={`admin-panel ${className}`}><header className="admin-panel-heading"><span className="admin-surface-icon" aria-hidden="true">{icon}</span><div><h2>{title}</h2><p>{description}</p></div>{actions && <div className="admin-panel-actions">{actions}</div>}</header>{children}</section>;
}
