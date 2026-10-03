import Link from 'next/link';
import Image from 'next/image';
import {BusinessesIcon as FiBriefcase, NfcIcon as FiCreditCard, LeadsIcon as FiUsers, AnalyticsIcon as FiBarChart2, TrophyIcon as FiAward} from '@/components/admin/icons';
import {FiPlus,FiMoreVertical} from '@/components/admin/profile-builder/BuilderIcons';
import {listOrganizations} from '@/lib/services/organizations';
import {listLeads} from '@/lib/services/leads';
import {db} from '@/lib/db';
import {Badge} from '@/components/ui/Badge';
import {OverviewPanel} from '@/components/admin/OverviewPanel';
import {creationHistory, leadAge} from '@/lib/admin-overview';
import {formatDate, organizationStatusTone} from '@/lib/format';

export default async function AdminOverviewPage() {
  const [organizations, leads, activeCards, cards, profiles] = await Promise.all([
    listOrganizations(), listLeads(), db.nFCCard.count({where:{status:'ACTIVE'}}),
    db.nFCCard.groupBy({by:['organizationId'],_count:{_all:true}}),
    db.businessProfile.findMany({select:{organizationId:true,logoUrl:true}}),
  ]);
  const history = creationHistory(organizations, leads);
  const max = Math.max(1,...history.map(month=>Math.max(month.businesses,month.leads)));
  const metrics = [
    {label:'Businesses',value:organizations.length,detail:`${organizations.filter(org=>org.status==='ACTIVE').length} active businesses`,icon:FiBriefcase,tone:'green',href:'/admin/businesses'},
    {label:'Active NFC Cards',value:activeCards,detail:'Currently active cards',icon:FiCreditCard,tone:'blue'},
    {label:'New Leads',value:leads.filter(lead=>lead.status==='NEW').length,detail:'Business status: New',icon:FiUsers,tone:'amber',href:'/admin/leads?status=NEW'},
    {label:'Total Leads',value:leads.length,detail:'All received inquiries',icon:FiUsers,tone:'purple',href:'/admin/leads'},
  ];
  return <div className="admin-overview">
    <div className="admin-overview-title"><h1>Overview</h1><p>Here’s what’s happening across your NFC platform today.</p></div>
    <div className="admin-kpi-grid">{metrics.map(({icon:Icon,...metric})=>{
      const content=<><span className="admin-kpi-icon"><Icon aria-hidden="true"/></span><div><h2>{metric.label}</h2><strong>{metric.value.toLocaleString('en-US')}</strong><p>{metric.detail}</p></div></>;
      return metric.href?<Link key={metric.label} href={metric.href} className="admin-kpi" data-accent={metric.tone}>{content}</Link>:<div key={metric.label} className="admin-kpi" data-accent={metric.tone}>{content}</div>;
    })}</div>
    <div className="admin-overview-main">
      <OverviewPanel title="Recent Businesses" description="Latest businesses on your platform." icon={<FiBriefcase/>} actions={<><Link className="admin-action" href="/admin/businesses">View all</Link><Link className="admin-action is-primary" href="/admin/businesses/new"><FiPlus/> Add Business</Link></>}>
        <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>Business</th><th>Subscription</th><th>NFC Cards</th><th>Status</th><th>Joined ↓</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{organizations.slice(0,5).map(org=>{
          const logo=profiles.find(profile=>profile.organizationId===org.id)?.logoUrl;
          return <tr key={org.id}><td><Link className="admin-identity" href={`/admin/businesses/${org.id}`}><span className="admin-avatar">{logo?<Image src={logo} width={40} height={40} unoptimized alt=""/>:org.name.slice(0,1)}</span><span><strong>{org.name}</strong><small>{org.businessType || 'Business profile'}</small></span></Link></td><td><Badge tone={org.subscription?.status==='ACTIVE'?'green':'gray'}>{org.subscription?.status.replaceAll('_',' ') || 'None'}</Badge></td><td>{cards.find(card=>card.organizationId===org.id)?._count._all || 0}</td><td><Badge tone={organizationStatusTone(org.status)}>{org.status.charAt(0)+org.status.slice(1).toLowerCase()}</Badge></td><td className="admin-metadata">{formatDate(org.createdAt)}</td><td><details className="admin-row-menu"><summary aria-label={`Actions for ${org.name}`}><FiMoreVertical/></summary><div><Link href={`/admin/businesses/${org.id}`}>Open Builder</Link><Link href={`/${org.slug}`} target="_blank" rel="noopener noreferrer">View public profile</Link></div></details></td></tr>;
        })}</tbody></table>{!organizations.length&&<p className="admin-panel-empty">No businesses yet. Add your first business to get started.</p>}</div>
      </OverviewPanel>
      <OverviewPanel title="Recent Leads" description="Latest inquiries received by the platform." icon={<FiUsers/>} actions={<Link className="admin-action" href="/admin/leads">View all</Link>}>
        <div className="admin-recent-leads">{leads.slice(0,5).map(lead=><Link key={lead.id} href={`/admin/leads/${lead.id}`} className="admin-lead-row"><span className="admin-avatar">{lead.name.split(' ').map(part=>part[0]).slice(0,2).join('')}</span><span className="admin-lead-copy"><strong>{lead.name}</strong><small>{lead.email || lead.phone}</small></span><span className="admin-lead-meta"><time dateTime={lead.createdAt.toISOString()}>{leadAge(lead.createdAt)}</time><Badge tone={lead.status==='NEW'?'blue':'gray'}>{lead.status.charAt(0)+lead.status.slice(1).toLowerCase()}</Badge>{!lead.seenAt&&<small className="admin-unseen">Unseen</small>}</span></Link>)}{!leads.length&&<p className="admin-panel-empty">No inquiries yet.</p>}</div>
      </OverviewPanel>
    </div>
    <div className="admin-overview-lower">
      <OverviewPanel title="Platform Growth" description="New businesses and leads by creation date." icon={<FiBarChart2/>} actions={<span className="admin-action">Last 12 months</span>}>
        <div className="admin-chart" role="img" aria-label={`Monthly creation history: ${history.map(month=>`${month.label}: ${month.businesses} businesses, ${month.leads} leads`).join('; ')}`}><div className="admin-chart-axis" aria-hidden="true"><span>{max}</span><span>{Math.round(max/2)}</span><span>0</span></div><div className="admin-chart-plot" aria-hidden="true">{history.map((month,index)=><div className="admin-chart-month" key={index}><div className="admin-chart-bars"><span style={{height:`${month.businesses/max*100}%`}}/><span style={{height:`${month.leads/max*100}%`}}/></div><small>{month.label}</small></div>)}</div></div><div className="admin-chart-legend"><span>Businesses</span><span>Leads</span></div>
      </OverviewPanel>
      <OverviewPanel title="Top Performing Businesses" description="Profile-view ranking is not available yet." icon={<FiAward/>}>
        <div className="admin-ranking-empty"><FiBarChart2 aria-hidden="true"/><h3>No performance data yet</h3><p>Profile views aren’t tracked yet. Rankings will appear when real analytics are available.</p><Link className="admin-action" href="/admin/businesses">View businesses</Link></div>
      </OverviewPanel>
    </div>
  </div>;
}
